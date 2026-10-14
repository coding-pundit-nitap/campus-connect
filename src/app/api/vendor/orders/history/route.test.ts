import { makeRequest } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils/order.utils", async () =>
  (await import("@tests/helpers/api")).orderUtilsModule()
);

import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const db = asMock(prisma);
const get = (query = "") =>
  GET(makeRequest(`/api/vendor/orders/history${query}`));
const findArgs = () => db.order.findMany.mock.calls[0][0];

describe("GET /api/vendor/orders/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    db.order.findMany.mockResolvedValue([{ id: "o1" }]);
    db.order.count.mockResolvedValue(45);
  });

  it("returns the first page with defaults", async () => {
    expect(await expectSuccess(await get())).toEqual({
      orders: [{ id: "o1", serialized: true }],
      total: 45,
      page: 1,
      pageSize: 20,
      hasMore: true,
    });
    expect(findArgs()).toMatchObject({
      where: { shop_id: "shop-1" },
      skip: 0,
      take: 20,
    });
    expect(db.order.count).toHaveBeenCalledWith({
      where: { shop_id: "shop-1" },
    });
  });

  it("applies every valid filter", async () => {
    const data = await expectSuccess<{ hasMore: boolean }>(
      await get(
        "?page=3&pageSize=20&search=%20al%20&status=COMPLETED&paymentStatus=COMPLETED&from=2026-01-01&to=2026-01-31"
      )
    );

    expect(data.hasMore).toBe(false);
    expect(findArgs()).toMatchObject({ skip: 40, take: 20 });
    expect(findArgs().where).toEqual({
      shop_id: "shop-1",
      order_status: "COMPLETED",
      payment_status: "COMPLETED",
      created_at: {
        gte: new Date("2026-01-01"),
        lte: new Date("2026-01-31"),
      },
      OR: [
        { display_id: { contains: "al", mode: "insensitive" } },
        { user: { name: { contains: "al", mode: "insensitive" } } },
      ],
    });
  });

  it("ignores ALL, unknown enums and unparseable dates", async () => {
    await get("?status=ALL&paymentStatus=BOGUS&from=nope&to=nope");
    await get("?status=BOGUS&paymentStatus=ALL");

    expect(db.order.findMany.mock.calls[0][0].where).toEqual({
      shop_id: "shop-1",
    });
    expect(db.order.findMany.mock.calls[1][0].where).toEqual({
      shop_id: "shop-1",
    });
  });

  it.each([
    ["?page=0&pageSize=500", 1, 50],
    ["?page=x&pageSize=-3", 1, 1],
  ])("clamps paging for %s", async (query, page, pageSize) => {
    expect(await expectSuccess(await get(query))).toMatchObject({
      page,
      pageSize,
    });
  });

  it.each([
    [new UnauthenticatedError(), 401, "Unauthorized"],
    [new UnauthorizedError(), 403, "Forbidden"],
    [new ForbiddenError(), 403, "Forbidden"],
    [new Error("db"), 500, "Failed to load order history"],
  ])("maps %s to %d", async (error, status, details) => {
    auth.getOwnedShopId.mockRejectedValue(error);

    await expectError(await get(), status, details);
  });
});
