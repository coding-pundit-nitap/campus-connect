import { expect, vi } from "vitest";

import { createPrismaMock, type PrismaMock } from "../prisma-mock";

/**
 * Module factory for "@/lib/prisma":
 *   vi.mock("@/lib/prisma", async () => (await import("@tests/helpers/api")).prismaModule());
 *   import { prisma } from "@/lib/prisma";
 *   const db = asMock(prisma);
 */
export const prismaModule = () => ({ prisma: createPrismaMock() });

/** View the mocked prisma singleton as a PrismaMock. */
export const asMock = (client: unknown) => client as PrismaMock;

type Envelope<T> = {
  success: boolean;
  error: boolean;
  details: string;
  data: T;
};

/** Assert an ActionResponse success envelope and return its data. */
export async function expectSuccess<T = unknown>(
  res: Response,
  status = 200
): Promise<T> {
  expect(res.status).toBe(status);
  const body = (await res.json()) as Envelope<T>;
  expect(body.success).toBe(true);
  return body.data;
}

/** Assert an ActionResponse error envelope with the given status/details. */
export async function expectError(
  res: Response,
  status: number,
  details?: string | RegExp
) {
  expect(res.status).toBe(status);
  const body = (await res.json()) as Envelope<null>;
  expect(body.success).toBe(false);
  expect(body.error).toBe(true);
  if (typeof details === "string") expect(body.details).toBe(details);
  else if (details) expect(body.details).toMatch(details);
}

/** Read and decode the next `count` chunks of an SSE response body. */
export async function readSse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  count = 1
): Promise<string[]> {
  const decoder = new TextDecoder();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const { value, done } = await reader.read();
    if (done) break;
    out.push(decoder.decode(value));
  }
  return out;
}

/** Parse the `data:` line of a single SSE event chunk. */
export const sseData = <T = unknown>(chunk: string): T =>
  JSON.parse(/^data: (.*)$/m.exec(chunk)![1]) as T;

/** Marks an object as having passed through a (mocked) serializer. */
export const serialized = <T extends object>(o: T) => ({
  ...o,
  serialized: true,
});

/** Factory for "@/lib/utils/order.utils" with a pass-through serializer. */
export const orderUtilsModule = () => ({
  orderWithDetailsInclude: { items: true },
  serializeOrderWithDetails: vi.fn((o: object) => serialized(o)),
});

/** Factory for "@/lib/shop-utils" with a pass-through formatter. */
export const shopUtilsModule = () => ({
  formatShopData: vi.fn((o: object) => serialized(o)),
});

/**
 * Temporarily override fields on the (plain-object) `env` export of
 * "@/config/env.config". Returns a function that restores the old values.
 */
export function overrideEnv(
  env: object,
  overrides: Record<string, unknown>
): () => void {
  const target = env as Record<string, unknown>;
  const previous = Object.fromEntries(
    Object.keys(overrides).map((k) => [k, target[k]])
  );
  Object.assign(target, overrides);
  return () => Object.assign(target, previous);
}

/**
 * Factory for "@/app/api/_lib/vendor-shop". Defaults to resolving "shop-1";
 * override per test with
 *   vi.mocked(resolveVendorShop).mockResolvedValue({ error: someResponse }).
 */
export const vendorShopModule = () => ({
  resolveVendorShop: vi.fn(async () => ({ shopId: "shop-1" })),
});
