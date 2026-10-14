import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { orderRepository } from "@/di/container";
import { UnauthenticatedError, UnauthorizedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const orders = vi.mocked(orderRepository);

describe("GET /api/seller/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
  });

  it("returns the owned shop's orders", async () => {
    orders.getOrdersByShopId.mockResolvedValue([{ id: "o1" }] as never);

    expect(await expectSuccess(await GET())).toEqual([{ id: "o1" }]);
    expect(orders.getOrdersByShopId).toHaveBeenCalledWith("shop-1");
  });

  it("returns 401 when the user is not signed in", async () => {
    auth.getOwnedShopId.mockRejectedValue(new UnauthenticatedError());

    await expectError(await GET(), 401, "Unauthorized");
  });

  it("returns 403 when the caller owns no shop", async () => {
    auth.getOwnedShopId.mockRejectedValue(new UnauthorizedError());

    await expectError(await GET(), 403, "Forbidden");
  });

  it("returns 500 on unexpected errors", async () => {
    orders.getOrdersByShopId.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "Failed to fetch orders");
  });
});
