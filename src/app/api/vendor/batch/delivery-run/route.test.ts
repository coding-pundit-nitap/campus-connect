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

describe("GET /api/vendor/batch/delivery-run", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns orders out for delivery for the vendor's shop", async () => {
    db.order.findMany.mockResolvedValue([{ id: "o1" }]);

    expect(await expectSuccess(await GET())).toEqual([
      { id: "o1", serialized: true },
    ]);
    expect(db.order.findMany.mock.calls[0][0].where.shop_id).toBe("shop-1");
  });

  it("returns the vendor-shop error response as is", async () => {
    vi.mocked(resolveVendorShop).mockResolvedValueOnce({
      error: errorJson("Not authorized", 401),
    });

    await expectError(await GET(), 401, "Not authorized");
  });

  it.each([[new Error("db down: host=10.0.0.5")], ["boom"]])(
    "returns a generic 500 without leaking the cause (%s)",
    async (error) => {
      db.order.findMany.mockRejectedValue(error);

      await expectError(await GET(), 500, "An internal server error occurred.");
    }
  );
});
