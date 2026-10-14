import { type Mock, vi } from "vitest";

import type { PrismaClient } from "@/generated/client";

type ModelMock = Record<string, Mock>;

export type PrismaMock = {
  [model: string]: ModelMock;
} & {
  $transaction: Mock;
  $queryRaw: Mock;
  $queryRawUnsafe: Mock;
  $executeRaw: Mock;
  $executeRawUnsafe: Mock;
  $connect: Mock;
  $disconnect: Mock;
};

const autoModel = (): ModelMock =>
  new Proxy({} as ModelMock, {
    get(t, prop) {
      if (typeof prop !== "string" || prop === "then") return undefined;
      return (t[prop] ??= vi.fn());
    },
  });

/**
 * A Prisma client double where `prisma.<model>.<method>` is lazily a `vi.fn()`.
 * `$transaction` runs interactive callbacks against the same mock and resolves
 * array form with `Promise.all`, so code under test behaves as with a real tx.
 */
export function createPrismaMock(): PrismaMock {
  const models = new Map<string, ModelMock>();
  const client = {
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  } as Record<string, unknown>;

  const proxy = new Proxy(client, {
    get(t, prop) {
      if (typeof prop !== "string" || prop === "then") return undefined;
      if (prop in t) return t[prop];
      if (!models.has(prop)) models.set(prop, autoModel());
      return models.get(prop);
    },
  }) as PrismaMock;

  client.$transaction = vi.fn(async (arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: PrismaMock) => unknown)(proxy)
      : Promise.all(arg as Promise<unknown>[])
  );

  return proxy;
}

/** View a PrismaMock as the real client type for constructor injection. */
export const asPrisma = (mock: PrismaMock) => mock as unknown as PrismaClient;
