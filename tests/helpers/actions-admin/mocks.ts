import { vi } from "vitest";

import { mockModule } from "../mock-of";
import { createPrismaMock } from "../prisma-mock";

// Module factories only. This file must not import any module that tests
// mock (e.g. "@/lib/verify-admin"): a vi.mock factory importing it would wait
// on itself and hang the test file.

/**
 * Factory for "@/di/container": every named export (repositories, services)
 * is a `mockOf()` object, and `container` is itself such a module whose
 * `db` is a Prisma double.
 *
 *   vi.mock("@/di/container", async () =>
 *     (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule());
 */
export function adminContainerModule() {
  return mockModule({ container: mockModule({ db: createPrismaMock() }) });
}

/** Factory for "@/lib/verify-admin". */
export function verifyAdminModule() {
  return { verifyAdmin: vi.fn() };
}
