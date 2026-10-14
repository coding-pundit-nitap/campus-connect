import { makeRequest, routeParams } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/product.utils", () => ({
  serializeProducts: vi.fn((rows: object[]) =>
    rows.map((r) => ({ ...r, s: 1 }))
  ),
}));

import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);
const get = (query = "", shop_id = "s1") =>
  GET(
    makeRequest(`/api/shops/${shop_id}/products${query}`),
    routeParams({ shop_id })
  );
const findArgs = () => db.product.findMany.mock.calls[0][0];

describe("GET /api/shops/[shop_id]/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.product.findMany.mockResolvedValue([]);
  });

  it("returns serialized products newest first by default", async () => {
    db.product.findMany.mockResolvedValue([{ id: "p1" }]);

    expect(await expectSuccess(await get())).toEqual({
      data: [{ id: "p1", s: 1 }],
      nextCursor: null,
      hasMore: false,
    });
    expect(findArgs()).toMatchObject({
      where: { shop_id: "s1", deleted_at: null },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 21,
      skip: 0,
      cursor: undefined,
    });
  });

  it("applies search, category, in-stock, sort and cursor", async () => {
    await get(
      "?search=tea&categoryId=c1&inStock=true&sortBy=price&sortOrder=asc&cursor=p9"
    );

    const args = findArgs();
    expect(args.where.OR).toHaveLength(3);
    expect(args.where.category_id).toBe("c1");
    expect(args.where.stock_quantity).toEqual({ gt: 0 });
    expect(args.orderBy).toEqual([{ price: "asc" }, { id: "asc" }]);
    expect(args).toMatchObject({ cursor: { id: "p9" }, skip: 1 });
  });

  it("filters out-of-stock products with inStock=false", async () => {
    await get("?inStock=false");

    expect(findArgs().where.stock_quantity).toEqual({ lte: 0 });
  });

  it("returns 400 without a shop id", async () => {
    await expectError(await get("", ""), 400, "Shop ID is required.");
  });

  it("returns 400 for an invalid sort field", async () => {
    await expectError(await get("?sortBy=nope"), 400);
  });

  it("returns 500 when the query fails", async () => {
    db.product.findMany.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "An internal server error occurred.");
  });
});
