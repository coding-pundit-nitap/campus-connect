import { makeRequest } from "@tests/helpers";
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
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const orders = vi.mocked(orderRepository);

describe("GET /api/search/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    orders.getPaginatedShopOrders.mockResolvedValue({
      orders: [{ id: "o1" }],
      nextCursor: "o0",
    } as never);
  });

  it("uses defaults and serializes the orders", async () => {
    const data = await expectSuccess(
      await GET(makeRequest("/api/search/orders"))
    );

    expect(data).toEqual({
      orders: [{ id: "o1", serialized: true }],
      nextCursor: "o0",
    });
    expect(orders.getPaginatedShopOrders).toHaveBeenCalledWith({
      shop_id: "shop-1",
      limit: 10,
      cursor: undefined,
      searchTerm: undefined,
      orderStatus: undefined,
      hostelBlock: undefined,
      dateRange: undefined,
    });
  });

  it("passes every filter through", async () => {
    await GET(
      makeRequest(
        "/api/search/orders?limit=5&cursor=c&q=tea&status=NEW&from=2026-01-01&to=2026-01-02&hostel_block=H1"
      )
    );

    expect(orders.getPaginatedShopOrders).toHaveBeenCalledWith({
      shop_id: "shop-1",
      limit: 5,
      cursor: "c",
      searchTerm: "tea",
      orderStatus: "NEW",
      hostelBlock: "H1",
      dateRange: { from: new Date("2026-01-01"), to: new Date("2026-01-02") },
    });
  });

  it("falls back to 10 for a non-numeric limit", async () => {
    await GET(makeRequest("/api/search/orders?limit=abc"));

    expect(orders.getPaginatedShopOrders).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it("ignores a half-open date range", async () => {
    await GET(makeRequest("/api/search/orders?from=2026-01-01"));

    expect(orders.getPaginatedShopOrders).toHaveBeenCalledWith(
      expect.objectContaining({ dateRange: undefined })
    );
  });

  it("returns 401 when the caller owns no shop", async () => {
    auth.getOwnedShopId.mockResolvedValue("");

    await expectError(
      await GET(makeRequest("/api/search/orders")),
      401,
      "Unauthorized"
    );
  });

  it("returns 500 when the repository fails", async () => {
    orders.getPaginatedShopOrders.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/search/orders")),
      500,
      "Internal Server Error"
    );
  });
});
