import { makeRequest } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils/earnings", () => ({
  getPeriodRange: vi.fn(() => ({
    start: new Date("2026-01-01T00:00:00Z"),
    end: new Date("2026-01-02T00:00:00Z"),
  })),
  aggregateEarnings: vi.fn((rows: unknown[]) => ({ orderCount: rows.length })),
}));

import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";
import { aggregateEarnings, getPeriodRange } from "@/lib/utils/earnings";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const db = asMock(prisma);
const get = (query = "") => GET(makeRequest(`/api/vendor/earnings${query}`));

describe("GET /api/vendor/earnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    db.order.findMany.mockResolvedValue([]);
  });

  it("aggregates completed orders in the period with numeric money fields", async () => {
    db.order.findMany.mockResolvedValue([
      {
        item_total: "10",
        delivery_fee: "2",
        platform_fee: "1",
        total_price: "13",
        payment_method: "CASH",
      },
    ]);

    expect(await expectSuccess(await get("?period=week"))).toEqual({
      period: "week",
      periodStart: "2026-01-01T00:00:00.000Z",
      periodEnd: "2026-01-02T00:00:00.000Z",
      orderCount: 1,
    });
    expect(getPeriodRange).toHaveBeenCalledWith("week");
    expect(aggregateEarnings).toHaveBeenCalledWith([
      {
        item_total: 10,
        delivery_fee: 2,
        platform_fee: 1,
        total_price: 13,
        payment_method: "CASH",
      },
    ]);
    expect(db.order.findMany.mock.calls[0][0].where).toMatchObject({
      shop_id: "shop-1",
      order_status: "COMPLETED",
    });
  });

  it.each(["", "?period=year"])(
    "defaults to today for a missing/unknown period (%s)",
    async (query) => {
      expect(await expectSuccess(await get(query))).toMatchObject({
        period: "today",
      });
    }
  );

  it.each([
    [new UnauthenticatedError(), 401, "Unauthorized"],
    [new UnauthorizedError(), 403, "Forbidden"],
    [new ForbiddenError(), 403, "Forbidden"],
    [new Error("db"), 500, "Failed to load earnings"],
  ])("maps %s to %d", async (error, status, details) => {
    auth.getOwnedShopId.mockRejectedValue(error);

    await expectError(await get(), status, details);
  });
});
