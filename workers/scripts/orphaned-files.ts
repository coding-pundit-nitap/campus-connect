import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

import type { prisma as prismaClient } from "../lib/prisma.js";

export interface CleanupResult {
  totalFilesScanned: number;
  orphanedCount: number;
  deletedCount: number;
  errorCount: number;
}

export interface OrphanCleanupDeps {
  /** Streams every object key in the bucket. */
  listKeys: () => AsyncIterable<string>;
  /** True when any DB row still points at the key. */
  isKeyReferenced: (key: string) => Promise<boolean>;
  deleteFile: (key: string) => Promise<void>;
  bucketName: string;
  batchSize: number;
  console: Pick<Console, "log" | "error">;
}

export function parseCliArgs(argv: readonly string[]): { dryRun: boolean } {
  return { dryRun: argv.slice(2).includes("--dry-run") };
}

export function createS3KeyStore(
  s3Client: Pick<S3Client, "send">,
  bucketName: string,
  batchSize: number
): Pick<OrphanCleanupDeps, "listKeys" | "deleteFile"> {
  async function* listKeys(): AsyncGenerator<string> {
    let continuationToken: string | undefined;

    do {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
          MaxKeys: batchSize,
        })
      );

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) yield obj.Key;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
  }

  async function deleteFile(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: key })
    );
  }

  return { listKeys, deleteFile };
}

export function createKeyReferenceChecker(
  db: Pick<typeof prismaClient, "shop" | "product" | "user">
): (key: string) => Promise<boolean> {
  return async (key) => {
    const [shopCount, productCount, userCount] = await Promise.all([
      db.shop.count({
        where: { OR: [{ image_key: key }, { qr_image_key: key }] },
      }),
      db.product.count({ where: { image_key: key } }),
      db.user.count({ where: { image: key } }),
    ]);

    return shopCount > 0 || productCount > 0 || userCount > 0;
  };
}

/**
 * Streams bucket keys and, for every key no DB row references, either reports
 * it (dry run) or deletes it. Per-file delete failures are counted, not thrown.
 */
export async function cleanupOrphanedFiles(
  dryRun: boolean,
  deps: OrphanCleanupDeps
): Promise<CleanupResult> {
  const out = deps.console;
  out.log("🔍 Starting orphaned file cleanup (streaming mode)...");
  out.log(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  out.log(`   Bucket: ${deps.bucketName}`);
  out.log(`   Batch size: ${deps.batchSize}`);
  out.log("");

  const result: CleanupResult = {
    totalFilesScanned: 0,
    orphanedCount: 0,
    deletedCount: 0,
    errorCount: 0,
  };

  out.log("📂 Scanning files...");

  for await (const key of deps.listKeys()) {
    result.totalFilesScanned++;

    if (result.totalFilesScanned % 100 === 0) {
      out.log(`   Scanned ${result.totalFilesScanned} files...`);
    }

    if (await deps.isKeyReferenced(key)) continue;

    result.orphanedCount++;

    if (dryRun) {
      out.log(`   🔸 Orphaned: ${key}`);
      continue;
    }

    try {
      await deps.deleteFile(key);
      result.deletedCount++;
      out.log(`   ✓ Deleted: ${key}`);
    } catch (error) {
      result.errorCount++;
      out.error(
        `   ✗ Failed: ${key} - ${error instanceof Error ? error.message : error}`
      );
    }
  }

  out.log("");
  out.log("📊 Summary:");
  out.log(`   Files scanned: ${result.totalFilesScanned}`);
  out.log(`   Orphaned files: ${result.orphanedCount}`);
  if (!dryRun) {
    out.log(`   Deleted: ${result.deletedCount}`);
    out.log(`   Errors: ${result.errorCount}`);
  }

  return result;
}
