import { beforeEach, describe, expect, it, vi } from "vitest";

import authUtils from "@/lib/utils/auth.utils.server";

import AdminLayout from "./layout";

const unauthorized = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_UNAUTHORIZED");
  })
);

vi.mock("next/navigation", () => ({ unauthorized }));
vi.mock("@/components/wrapper/pro-layout-continer", () => ({
  default: () => null,
}));
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

const isAdmin = vi.mocked(authUtils.isAdmin);

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the admin shell for an admin", async () => {
    isAdmin.mockResolvedValue(true);

    await expect(AdminLayout({ children: null })).resolves.toBeTruthy();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it.each([
    ["a signed-in non-admin", () => isAdmin.mockResolvedValue(false)],
    [
      "a signed-out visitor",
      () => isAdmin.mockRejectedValue(new Error("signed out")),
    ],
  ])("refuses %s", async (_n, arrange) => {
    arrange();

    await expect(AdminLayout({ children: null })).rejects.toThrow(
      "NEXT_UNAUTHORIZED"
    );
  });
});
