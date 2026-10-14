import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils", () => ({
  serializeFullCart: vi.fn((c: object) => ({ ...c, serialized: true })),
}));

import { cartRepository } from "@/di/container";
import { UnauthenticatedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const carts = vi.mocked(cartRepository);

describe("GET /api/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns 400 when shop_id is missing", async () => {
    await expectError(
      await GET(makeRequest("/api/cart")),
      400,
      "shop_id query parameter is required"
    );
    expect(carts.findOrCreate).not.toHaveBeenCalled();
  });

  it("returns the serialized find-or-create cart for the shop", async () => {
    carts.findOrCreate.mockResolvedValue({ id: "c1" } as never);

    const data = await expectSuccess(
      await GET(makeRequest("/api/cart?shop_id=s1"))
    );

    expect(carts.findOrCreate).toHaveBeenCalledWith("user-1", "s1");
    expect(data).toEqual({ id: "c1", serialized: true });
  });

  it("returns 401 when the user is not signed in", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectError(
      await GET(makeRequest("/api/cart?shop_id=s1")),
      401,
      "Unauthorized"
    );
  });

  it("returns 500 on unexpected errors", async () => {
    carts.findOrCreate.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/cart?shop_id=s1")),
      500,
      "An internal server error occurred."
    );
  });
});
