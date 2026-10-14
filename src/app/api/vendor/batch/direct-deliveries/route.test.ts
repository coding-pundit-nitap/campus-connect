import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorJson } from "@/app/api/_lib/route-helpers";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/order.utils", async () =>
  (await import("@tests/helpers/api")).orderUtilsModule()
);
vi.mock("@/app/api/_lib/vendor-shop", async () =>
  (await import("@tests/helpers/api")).vendorShopModule()
);

import { resolveVendorShop } from "@/app/api/_lib/vendor-shop";
import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);

describe("GET /api/vendor/batch/direct-deliveries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the shop's active direct-delivery orders", async () => {
    db.order.findMany.mockResolvedValue([{ id: "o1" }]);

    expect(await expectSuccess(await GET())).toEqual([
      { id: "o1", serialized: true },
    ]);
    expect(db.order.findMany.mock.calls[0][0].where).toEqual({
      shop_id: "shop-1",
      is_direct_delivery: true,
      order_status: { in: ["NEW", "BATCHED", "OUT_FOR_DELIVERY"] },
    });
  });

  it("returns the vendor-shop error response as is", async () => {
    vi.mocked(resolveVendorShop).mockResolvedValueOnce({
      error: errorJson("Shop not found", 400),
    });

    await expectError(await GET(), 400, "Shop not found");
  });

  it.each([
    [new Error("db down"), "db down"],
    ["boom", "Failed to get direct deliveries data"],
  ])("returns 500 on failure (%s)", async (error, message) => {
    db.order.findMany.mockRejectedValue(error);

    await expectError(await GET(), 500, message);
  });
});
