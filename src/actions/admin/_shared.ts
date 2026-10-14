// Internal helpers for the admin server actions.
// NOTE: deliberately NOT a "use server" module: nothing here may become a
// client-callable endpoint.

import { runAction } from "@/actions/_shared/action-helpers";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/custom-error";
import type { createLogger } from "@/lib/logger";
import { verifyAdmin } from "@/lib/verify-admin";
import type { CursorPaginatedResponse } from "@/types/response.types";

type Logger = Pick<ReturnType<typeof createLogger>, "error">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorClass = new (...args: any[]) => Error;

/** Errors that every admin action rethrows untouched (auth + bad input). */
const ALWAYS_RETHROWN: readonly ErrorClass[] = [
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
];

export interface AdminActionOptions {
  /** Message logged together with the caught error. */
  label: string;
  /** Message of the InternalServerError thrown for unexpected errors. */
  fallback: string;
  /** Extra error classes (besides ALWAYS_RETHROWN) rethrown as-is. */
  passthrough?: readonly ErrorClass[];
}

/**
 * Verifies the caller is an admin, runs `fn` with the admin id and maps
 * failures: auth, bad-request and `passthrough` errors are rethrown, anything else
 * is logged and replaced by an InternalServerError(`fallback`).
 */
export async function runAdminAction<T>(
  log: Logger,
  { label, fallback, passthrough = [] }: AdminActionOptions,
  fn: (adminId: string) => Promise<T>
): Promise<T> {
  return runAction(
    log,
    { label, fallback, passthrough: [...ALWAYS_RETHROWN, ...passthrough] },
    async () => fn(await verifyAdmin())
  );
}

/** Prisma pagination args fetching one extra row to detect a next page. */
export function cursorArgs(limit: number, cursor?: string) {
  return {
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  };
}

/** Turns rows fetched with `cursorArgs` into a cursor-paginated page. */
export function toCursorPage<T extends { id: string }>(
  rows: T[],
  limit: number
): CursorPaginatedResponse<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, -1) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;
  return { data, nextCursor, hasMore };
}

/** Builds a `created_at` range filter, or undefined when no bound is set. */
export function dateRange(
  start?: Date,
  end?: Date
): { gte?: Date; lte?: Date } | undefined {
  if (!start && !end) return undefined;
  return {
    ...(start && { gte: start }),
    ...(end && { lte: end }),
  };
}

/** Reads `_count[key]` from a Prisma groupBy row, defaulting to 0. */
export function groupCount(count: unknown, key: string): number {
  if (count && typeof count === "object") {
    return (count as Record<string, number | undefined>)[key] ?? 0;
  }
  return 0;
}
