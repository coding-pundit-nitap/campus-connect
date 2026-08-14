import { ADMIN_DATABASE_URL, workerDbName } from "./worker-count";

/** Resolves this worker's database URL. VITEST_POOL_ID is 1-based. */
export function workerDatabaseUrl(poolId: string | undefined): string {
  const id = poolId ?? "1";
  return ADMIN_DATABASE_URL.replace(/\/[^/]+$/, `/${workerDbName(id)}`);
}
