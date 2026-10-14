import { makeRequest } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);

const announcement = (overrides: Record<string, unknown> = {}) => ({
  id: "a1",
  shop_id: "s1",
  shop: { name: "Shop", shop_type: "CANTEEN" },
  title: "Sale",
  message: "Half off",
  image_key: null,
  expires_at: new Date("2026-01-02T00:00:00Z"),
  created_at: new Date("2026-01-01T00:00:00Z"),
  product: null,
  ...overrides,
});

describe("GET /api/announcements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializes announcements without a product", async () => {
    db.shopAnnouncement.findMany.mockResolvedValue([announcement()]);

    const data = await expectSuccess<unknown[]>(
      await GET(makeRequest("/api/announcements"))
    );

    expect(data).toEqual([
      {
        id: "a1",
        shop_id: "s1",
        shop_name: "Shop",
        shop_type: "CANTEEN",
        title: "Sale",
        message: "Half off",
        image_key: null,
        expires_at: "2026-01-02T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
        product: null,
      },
    ]);
    const where = db.shopAnnouncement.findMany.mock.calls[0][0].where;
    expect(where.shop).toBeUndefined();
  });

  it.each([
    ["with a discount", "5", 5],
    ["without a discount", null, null],
  ])(
    "serializes the attached product %s",
    async (_label, discount, expected) => {
      db.shopAnnouncement.findMany.mockResolvedValue([
        announcement({
          product: {
            id: "p1",
            name: "Tea",
            price: "10",
            discount,
            stock_quantity: 3,
            image_key: "k",
            brand: "B",
            is_veg: true,
          },
        }),
      ]);

      const [item] = await expectSuccess<{ product: unknown }[]>(
        await GET(makeRequest("/api/announcements"))
      );

      expect(item.product).toEqual({
        id: "p1",
        name: "Tea",
        price: 10,
        discount: expected,
        stock_quantity: 3,
        image_key: "k",
        brand: "B",
        is_veg: true,
      });
    }
  );

  it("filters by shop type when a specific type is given", async () => {
    db.shopAnnouncement.findMany.mockResolvedValue([]);

    await GET(makeRequest("/api/announcements?type=CANTEEN"));

    const where = db.shopAnnouncement.findMany.mock.calls[0][0].where;
    expect(where.shop).toEqual({ shop_type: "CANTEEN" });
  });

  it("does not filter when type is ALL", async () => {
    db.shopAnnouncement.findMany.mockResolvedValue([]);

    await GET(makeRequest("/api/announcements?type=ALL"));

    const where = db.shopAnnouncement.findMany.mock.calls[0][0].where;
    expect(where.shop).toBeUndefined();
  });

  it("returns 500 when the query fails", async () => {
    db.shopAnnouncement.findMany.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/announcements")),
      500,
      "Failed to fetch announcements"
    );
  });
});
