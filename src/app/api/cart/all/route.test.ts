import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils/product.utils", () => ({
  serializeFullCarts: vi.fn((c: unknown[]) => c.map((x) => ({ x }))),
}));

import { cartService } from "@/di/container";
import { UnauthenticatedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);

describe("GET /api/cart/all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns all of the user's carts serialized", async () => {
    vi.mocked(cartService.getAllUserCarts).mockResolvedValue([
      { id: "c1" },
    ] as never);

    const data = await expectSuccess(await GET());

    expect(cartService.getAllUserCarts).toHaveBeenCalledWith("user-1");
    expect(data).toEqual([{ x: { id: "c1" } }]);
  });

  it("returns 401 when the user is not signed in", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectError(await GET(), 401, "Unauthorized");
  });

  it("returns 500 when the service fails", async () => {
    vi.mocked(cartService.getAllUserCarts).mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "An internal server error occurred.");
  });
});
