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
import { UnauthenticatedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const orders = vi.mocked(orderRepository);
const queryArg = () =>
  orders.getOrdersByUserId.mock.calls[0][1] as never as {
    take: number;
    cursor?: { id: string };
    skip: number;
    where: { order_status?: string; created_at?: unknown };
  };

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    orders.getOrdersByUserId.mockResolvedValue([] as never);
  });

  it("returns the first page with serialized orders and a next cursor", async () => {
    orders.getOrdersByUserId.mockResolvedValue([
      { id: "o2" },
      { id: "o1" },
    ] as never);

    const data = await expectSuccess(
      await GET(makeRequest("/api/orders?limit=1"))
    );

    expect(data).toEqual({
      data: [{ id: "o2", serialized: true }],
      nextCursor: "o2",
      hasMore: true,
    });
    expect(queryArg()).toMatchObject({ take: 2, skip: 0, cursor: undefined });
    expect(queryArg().where).toEqual({
      order_status: undefined,
      created_at: undefined,
    });
  });

  it("applies cursor, status and date-range filters", async () => {
    await GET(
      makeRequest(
        "/api/orders?cursor=o9&status=COMPLETED&date_from=2026-01-01&date_to=2026-01-31"
      )
    );

    expect(queryArg()).toMatchObject({ cursor: { id: "o9" }, skip: 1 });
    expect(queryArg().where).toEqual({
      order_status: "COMPLETED",
      created_at: {
        gte: new Date("2026-01-01"),
        lte: new Date("2026-01-31"),
      },
    });
  });

  it("returns 400 for an unknown status", async () => {
    await expectError(await GET(makeRequest("/api/orders?status=NOPE")), 400);
  });

  it("returns 400 when date_from is after date_to", async () => {
    await expectError(
      await GET(
        makeRequest("/api/orders?date_from=2026-02-01&date_to=2026-01-01")
      ),
      400,
      "date_from must be before date_to"
    );
    expect(orders.getOrdersByUserId).not.toHaveBeenCalled();
  });

  it("filters with only a lower date bound", async () => {
    await GET(makeRequest("/api/orders?date_from=2026-01-01"));

    expect(queryArg().where.created_at).toEqual({
      gte: new Date("2026-01-01"),
      lte: undefined,
    });
  });

  it("returns 500 when the repository fails", async () => {
    orders.getOrdersByUserId.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/orders")),
      500,
      "Failed to fetch orders"
    );
  });

  it("returns 401 (not 500) when the caller is signed out", async () => {
    auth.getUserId.mockRejectedValue(
      new UnauthenticatedError("Please log in first.")
    );

    await expectError(await GET(makeRequest("/api/orders")), 401);
    expect(orders.getOrdersByUserId).not.toHaveBeenCalled();
  });
});
