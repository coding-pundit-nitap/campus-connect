import { ADMIN_DATABASE_URL, workerDbName } from "./worker-count";

export function workerDatabaseUrl(poolId: string | undefined): string {
  const id = poolId ?? "1";
  return ADMIN_DATABASE_URL.replace(/\/[^/]+$/, `/${workerDbName(id)}`);
}
