import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorJson } from "@/app/api/_lib/route-helpers";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
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
import { batchRepository } from "@/di/container";
import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);
const batches = vi.mocked(batchRepository);

describe("GET /api/vendor/batch/active", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the open batch with its pending orders", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue({ id: "b1" } as never);
    db.order.findMany.mockResolvedValue([{ id: "o1" }]);

    expect(await expectSuccess(await GET())).toEqual({
      batch: { id: "b1" },
      orders: [{ id: "o1", serialized: true }],
    });
    expect(batches.findOpenBatchByShopId).toHaveBeenCalledWith("shop-1");
    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { batch_id: "b1", order_status: { in: ["NEW", "BATCHED"] } },
      })
    );
  });

  it("returns an empty result when there is no open batch", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue(null as never);

    expect(await expectSuccess(await GET())).toEqual({
      batch: null,
      orders: [],
    });
    expect(db.order.findMany).not.toHaveBeenCalled();
  });

  it("returns the vendor-shop error response as is", async () => {
    vi.mocked(resolveVendorShop).mockResolvedValueOnce({
      error: errorJson("Shop not found", 400),
    });

    await expectError(await GET(), 400, "Shop not found");
  });

  it.each([[new Error("db down: host=10.0.0.5")], ["boom"]])(
    "returns a generic 500 without leaking the cause (%s)",
    async (error) => {
      batches.findOpenBatchByShopId.mockRejectedValue(error);

      await expectError(await GET(), 500, "An internal server error occurred.");
    }
  );
});
