import { vi } from "vitest";

/**
 * Module factories for Next.js runtime APIs that only work inside a request.
 * Use as: vi.mock("next/navigation", async () => (await import("@tests/helpers")).nextNavigation())
 * They're registered globally in both unit and integration setup files.
 */
export const nextHeaders = () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: () => undefined,
    getAll: () => [],
    set: vi.fn(),
    delete: vi.fn(),
  })),
});

const thrower = (tag: string) => (url?: string) => {
  throw new Error(url === undefined ? tag : `${tag}:${url}`);
};

export const nextNavigation = () => ({
  notFound: thrower("NEXT_NOT_FOUND"),
  redirect: thrower("NEXT_REDIRECT"),
  permanentRedirect: thrower("NEXT_REDIRECT"),
  unauthorized: thrower("NEXT_UNAUTHORIZED"),
  forbidden: thrower("NEXT_FORBIDDEN"),
});

export const nextCache = () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: vi.fn(<T>(fn: T) => fn),
});
