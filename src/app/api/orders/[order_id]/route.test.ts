import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils/order.utils", async () =>
  (await import("@tests/helpers/api")).orderUtilsModule()
);

import { orderRepository } from "@/di/container";
import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const orders = vi.mocked(orderRepository);
const get = () =>
  GET(makeRequest("/api/orders/o1"), routeParams({ order_id: "o1" }));

describe("GET /api/orders/[order_id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns the caller's order serialized", async () => {
    orders.getOrderById.mockResolvedValue({
      id: "o1",
      user_id: "user-1",
    } as never);

    const data = await expectSuccess(await get());

    expect(data).toEqual({ id: "o1", user_id: "user-1", serialized: true });
    expect(orders.getOrderById).toHaveBeenCalledWith("o1", {
      include: { items: true },
    });
  });

  it("returns 401 when the user id is empty", async () => {
    auth.getUserId.mockResolvedValue("");

    await expectError(await get(), 401, "Unauthorized");
  });

  it("returns 404 when the order does not exist", async () => {
    orders.getOrderById.mockResolvedValue(null as never);

    await expectError(await get(), 404, "Order not found");
  });

  it("returns 403 for someone else's order", async () => {
    orders.getOrderById.mockResolvedValue({
      id: "o1",
      user_id: "other",
    } as never);

    await expectError(await get(), 403, "Unauthorized to view this order");
  });

  it("returns 401 when not signed in", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectError(await get(), 401, "Unauthorized");
  });

  it.each([new UnauthorizedError(), new ForbiddenError()])(
    "returns 403 for %s",
    async (error) => {
      auth.getUserId.mockRejectedValue(error);

      await expectError(await get(), 403, "Unauthorized to view this order");
    }
  );

  it("returns 500 on unexpected errors", async () => {
    orders.getOrderById.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "Failed to retrieve order");
  });
});
