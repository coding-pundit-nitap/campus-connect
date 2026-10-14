import { S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config({ path: ".env" });

import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import {
  cleanupOrphanedFiles,
  createKeyReferenceChecker,
  createS3KeyStore,
  parseCliArgs,
} from "./orphaned-files.js";

const BUCKET_NAME = env.NEXT_PUBLIC_MINIO_BUCKET || "campus-connect";
const BATCH_SIZE = 100;

export function createS3Client(): S3Client {
  return new S3Client({
    endpoint: env.MINIO_ENDPOINT!,
    region: env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function main(argv: readonly string[] = process.argv) {
  const { dryRun } = parseCliArgs(argv);

  try {
    await cleanupOrphanedFiles(dryRun, {
      ...createS3KeyStore(createS3Client(), BUCKET_NAME, BATCH_SIZE),
      isKeyReferenced: createKeyReferenceChecker(prisma),
      bucketName: BUCKET_NAME,
      batchSize: BATCH_SIZE,
      console,
    });
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
