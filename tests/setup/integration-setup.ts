import { config as loadEnv } from "dotenv";
import Redis from "ioredis";
import { afterAll, beforeEach } from "vitest";

import { workerDatabaseUrl } from "./worker-db";

loadEnv({ path: ".env.test" });

process.env.DATABASE_URL = workerDatabaseUrl(process.env.VITEST_POOL_ID);
process.env.REDIS_URL = `redis://localhost:6380/${
  process.env.VITEST_POOL_ID ?? "1"
}`;

const { prisma } = await import("../../src/lib/prisma");
const { resetDatabase } = await import("./reset");
const { seedReferenceData } = await import("./seed-reference");

export const testPrisma = prisma;
export const testRedis = new Redis(process.env.REDIS_URL);

beforeEach(async () => {
  await resetDatabase(prisma);
  await testRedis.flushdb();
  await seedReferenceData(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
  await testRedis.quit();
});
