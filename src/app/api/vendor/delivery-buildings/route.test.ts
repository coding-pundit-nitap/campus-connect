import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorJson } from "@/app/api/_lib/route-helpers";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/app/api/_lib/vendor-shop", async () =>
  (await import("@tests/helpers/api")).vendorShopModule()
);

import { resolveVendorShop } from "@/app/api/_lib/vendor-shop";
import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);

describe("GET /api/vendor/delivery-buildings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the shop's active delivery buildings", async () => {
    db.shopDeliveryBuilding.findMany.mockResolvedValue([{ id: "sdb1" }]);

    expect(await expectSuccess(await GET())).toEqual([{ id: "sdb1" }]);
    expect(db.shopDeliveryBuilding.findMany.mock.calls[0][0].where).toEqual({
      shop_id: "shop-1",
      is_active: true,
      building: { is_active: true },
    });
  });

  it("returns the vendor-shop error response as is", async () => {
    vi.mocked(resolveVendorShop).mockResolvedValueOnce({
      error: errorJson("Not authorized", 401),
    });

    await expectError(await GET(), 401, "Not authorized");
  });

  it("returns 500 when the query fails", async () => {
    db.shopDeliveryBuilding.findMany.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "Failed to fetch delivery buildings");
  });
});
