import { expect, it, vi } from "vitest";

import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { verifyAdmin } from "@/lib/verify-admin";

export * from "./mocks";

export const ADMIN_ID = "admin-1";
/** A syntactically valid cuid for `cursor` options. */
export const CURSOR = "ckv9z7k3l0000qzrmn831i7rn";

/** Makes the mocked verifyAdmin resolve to ADMIN_ID. */
export function asAdmin(id: string = ADMIN_ID) {
  vi.mocked(verifyAdmin).mockResolvedValue(id);
}

/**
 * Registers the tests every admin action shares: auth errors propagate
 * unchanged and any unexpected error becomes InternalServerError(fallback).
 */
export function itGuardsAdminAccess(
  run: () => Promise<unknown>,
  fallback: string
) {
  it.each([
    ["UnauthorizedError", new UnauthorizedError("no session")],
    ["ForbiddenError", new ForbiddenError("not admin")],
  ])("rethrows %s from verifyAdmin", async (_name, error) => {
    vi.mocked(verifyAdmin).mockRejectedValueOnce(error);

    await expect(run()).rejects.toBe(error);
  });

  it("maps unexpected errors to InternalServerError", async () => {
    vi.mocked(verifyAdmin).mockRejectedValueOnce(new Error("boom"));

    const error = await run().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(InternalServerError);
    expect((error as Error).message).toBe(fallback);
  });
}

/** Builds `count` rows `{ id: "<prefix>-<n>", ...extra }`. */
export function rows<T extends object>(
  count: number,
  prefix: string,
  extra: (i: number) => T = () => ({}) as T
): Array<{ id: string } & T> {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    ...extra(i),
  }));
}
