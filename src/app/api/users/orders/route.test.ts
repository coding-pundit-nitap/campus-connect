import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { orderRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const orders = vi.mocked(orderRepository);

describe("GET /api/users/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("u1");
  });

  it("returns the user's orders with items and shop", async () => {
    orders.getOrdersByUserId.mockResolvedValue([{ id: "o1" }] as never);

    expect(await expectSuccess(await GET())).toEqual([{ id: "o1" }]);
    expect(orders.getOrdersByUserId).toHaveBeenCalledWith("u1", {
      include: { items: true, shop: true },
    });
  });

  it("returns 401 with an empty user id", async () => {
    auth.getUserId.mockResolvedValue("");

    await expectError(await GET(), 401, "User not authenticated");
  });

  it("returns 500 when the lookup fails", async () => {
    orders.getOrdersByUserId.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "An internal server error occurred.");
  });
});
