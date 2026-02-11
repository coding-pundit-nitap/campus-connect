import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { prisma } from "../lib/prisma";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET || "campus-connect";
const BATCH_SIZE = 100;

interface CleanupResult {
  totalFilesScanned: number;
  orphanedCount: number;
  deletedCount: number;
  errorCount: number;
}

async function* streamMinioKeys(): AsyncGenerator<string> {
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
      MaxKeys: BATCH_SIZE,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) yield obj.Key;
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
}

async function isKeyReferenced(key: string): Promise<boolean> {
  const [shopCount, productCount, userCount] = await Promise.all([
    prisma.shop.count({
      where: {
        OR: [{ image_key: key }, { qr_image_key: key }],
      },
    }),
    prisma.product.count({
      where: { image_key: key },
    }),
    prisma.user.count({
      where: { image: key },
    }),
  ]);

  return shopCount > 0 || productCount > 0 || userCount > 0;
}

async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
}

async function cleanupOrphanedFiles(dryRun: boolean): Promise<CleanupResult> {
  console.log("🔍 Starting orphaned file cleanup (streaming mode)...");
  console.log(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`   Bucket: ${BUCKET_NAME}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log("");

  const result: CleanupResult = {
    totalFilesScanned: 0,
    orphanedCount: 0,
    deletedCount: 0,
    errorCount: 0,
  };

  const orphanedFiles: string[] = [];

  console.log("📂 Scanning files...");

  for await (const key of streamMinioKeys()) {
    result.totalFilesScanned++;

    if (result.totalFilesScanned % 100 === 0) {
      console.log(`   Scanned ${result.totalFilesScanned} files...`);
    }

    const isReferenced = await isKeyReferenced(key);

    if (!isReferenced) {
      result.orphanedCount++;
      orphanedFiles.push(key);

      if (dryRun) {
        console.log(`   🔸 Orphaned: ${key}`);
      } else {
        try {
          await deleteFile(key);
          result.deletedCount++;
          console.log(`   ✓ Deleted: ${key}`);
        } catch (error) {
          result.errorCount++;
          console.error(
            `   ✗ Failed: ${key} - ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }
  }

  console.log("");
  console.log("📊 Summary:");
  console.log(`   Files scanned: ${result.totalFilesScanned}`);
  console.log(`   Orphaned files: ${result.orphanedCount}`);
  if (!dryRun) {
    console.log(`   Deleted: ${result.deletedCount}`);
    console.log(`   Errors: ${result.errorCount}`);
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  try {
    await cleanupOrphanedFiles(dryRun);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
