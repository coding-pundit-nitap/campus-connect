import { type Mock, type Mocked, vi } from "vitest";

/**
 * Builds an auto-mocking stand-in for any object/interface: every property
 * accessed that wasn't provided in `overrides` becomes a `vi.fn()` created on
 * first access and reused afterwards. Replaces hand-rolled
 * `{ foo: vi.fn(), bar: vi.fn() } as unknown as Repo` literals.
 */
export function mockOf<T extends object>(
  overrides: Partial<Record<keyof T, unknown>> = {}
): Mocked<T> {
  const target: Record<PropertyKey, unknown> = { ...overrides };
  return new Proxy(target, {
    get(t, prop) {
      // Never look like a thenable, or `await mock` would hang.
      if (prop === "then") return undefined;
      if (!(prop in t)) t[prop] = vi.fn();
      return t[prop];
    },
    has: () => true,
  }) as Mocked<T>;
}

/** Narrow helper for reading the args of the n-th call of a mock. */
export const callArg = <T = unknown>(fn: Mock, call = 0, arg = 0): T =>
  fn.mock.calls[call]?.[arg] as T;

/**
 * Module factory whose every export is itself a `mockOf()` object. Fits
 * singleton-export modules such as "@/di/container":
 *
 *   vi.mock("@/di/container", async () => (await import("@tests/helpers")).mockModule());
 *   import { cartRepository } from "@/di/container";
 *   vi.mocked(cartRepository.findOrCreate).mockResolvedValue(cart);
 */
export function mockModule(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const target: Record<PropertyKey, unknown> = { ...overrides };
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "then" || prop === "__esModule") return undefined;
      if (!(prop in t)) t[prop] = mockOf();
      return t[prop];
    },
    has: () => true,
  });
}
