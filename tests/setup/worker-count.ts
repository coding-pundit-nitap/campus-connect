import os from "node:os";

export const TEST_WORKERS = Number(
  process.env.TEST_WORKERS ?? Math.min(4, os.availableParallelism?.() ?? 4)
);

export const TEMPLATE_DB = "cc_test_tmpl";
export const workerDbName = (poolId: number | string) => `cc_test_w${poolId}`;

export const ADMIN_DATABASE_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  "postgresql://test:test@localhost:5433/postgres";
