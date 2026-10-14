import { config as loadEnv } from "dotenv";
import Redis from "ioredis";
import { afterAll, beforeEach, vi } from "vitest";

import { workerDatabaseUrl } from "./worker-db";

vi.mock("next/headers", async () => (await import("../helpers")).nextHeaders());
vi.mock("next/navigation", async () =>
  (await import("../helpers")).nextNavigation()
);
vi.mock("next/cache", async () => (await import("../helpers")).nextCache());

vi.mock("../../src/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/auth")>();
  const { getSession } = await import("./session-state");
  return {
    ...actual,
    auth: {
      ...actual.auth,
      api: {
        ...actual.auth.api,
        getSession: async () => getSession(),
      },
    },
  };
});

loadEnv({ path: ".env.test" });

process.env.DATABASE_URL = workerDatabaseUrl(process.env.VITEST_POOL_ID);
process.env.REDIS_URL = `redis://localhost:${
  process.env.TEST_REDIS_PORT ?? 6380
}/${
  process.env.VITEST_POOL_ID ?? "1"
}`;

const { prisma } = await import("../../src/lib/prisma");
const { resetDatabase } = await import("./reset");
const { seedReferenceData } = await import("./seed-reference");
const { setSession } = await import("./session-state");

export const testPrisma = prisma;
export const testRedis = new Redis(process.env.REDIS_URL);

beforeEach(async () => {
  await resetDatabase(prisma);
  await testRedis.flushdb();
  await seedReferenceData(prisma);
  setSession(null);
});

afterAll(async () => {
  await prisma.$disconnect();
  await testRedis.quit();
});
