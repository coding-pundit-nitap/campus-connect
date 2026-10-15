// Shared assertions for the rule-based authorization suite
// (tests/integration/spec/authz). Convention under test:
//   - route handlers: signed-out -> 401, signed-in but not allowed -> 403
//     (src/app/api/_lib/route-helpers.ts:authErrorResponse)
//   - server actions: signed-out -> UnauthenticatedError / UnauthorizedError,
//     signed-in but not allowed -> ForbiddenError / UnauthorizedError
//     (both map to 403 in authErrorResponse); never an InternalServerError.
import { NextRequest } from "next/server";
import { expect } from "vitest";

export const SIGNED_OUT_ERRORS = ["UnauthenticatedError", "UnauthorizedError"];
export const FORBIDDEN_ERRORS = ["ForbiddenError", "UnauthorizedError"];

async function rejectionOf(run: () => Promise<unknown>): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the call to be rejected, but it resolved");
}

/** The call rejects with an error whose name is one of `names`. */
export async function expectRejectedWith(
  run: () => Promise<unknown>,
  names: string[],
  label = "call"
): Promise<Error> {
  const error = await rejectionOf(run);
  expect(
    names,
    `${label} rejected with ${error?.name}: ${error?.message}`
  ).toContain(error?.name);
  return error;
}

/** The call rejects (any error) and the error text carries none of `secrets`. */
export async function expectDenied(
  run: () => Promise<unknown>,
  secrets: string[] = [],
  label = "call"
): Promise<Error> {
  const error = await rejectionOf(run);
  const text = `${error?.message ?? ""}`;
  for (const secret of secrets) {
    expect(text, `${label} leaked ${secret}`).not.toContain(secret);
  }
  return error;
}

export function req(path: string, init?: RequestInit): NextRequest {
  return new NextRequest(
    `http://localhost${path}`,
    init as ConstructorParameters<typeof NextRequest>[1]
  );
}

export function jsonReq(path: string, method: string, body: unknown) {
  return req(path, {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

export function params<T extends Record<string, unknown>>(value: T) {
  return { params: Promise.resolve(value) };
}
