import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import type { User } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { verifyAdmin } from "./verify-admin";

const auth = vi.mocked(authUtils);
const asUser = (u: Partial<User> | null) => u as User;

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the admin's id", async () => {
    auth.getUserData.mockResolvedValue(
      asUser({ id: "admin-1", role: "ADMIN" as User["role"] })
    );

    await expect(verifyAdmin()).resolves.toBe("admin-1");
  });

  it.each([[null], [{ role: "ADMIN" }], [{ id: "", role: "ADMIN" }]] as const)(
    "throws UnauthorizedError for session %j",
    async (user) => {
      auth.getUserData.mockResolvedValue(asUser(user as Partial<User> | null));

      await expect(verifyAdmin()).rejects.toThrow(
        new UnauthorizedError("Unauthorized: Please log in.")
      );
    }
  );

  it.each(["USER", "SELLER"])(
    "throws ForbiddenError for role %s",
    async (role) => {
      auth.getUserData.mockResolvedValue(
        asUser({ id: "u-1", role: role as User["role"] })
      );

      const error = await verifyAdmin().catch((e) => e);

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe("Access denied: Admin privileges required.");
    }
  );
});
