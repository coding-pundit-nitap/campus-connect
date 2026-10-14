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

/** Route findMany calls by their where clause. */
function stubOrders() {
  db.order.findMany.mockImplementation(async ({ where }) => {
    if (where.batch_id) return [{ id: "batch-order" }];
    if (where.OR) return [{ id: "delivery-order" }];
    return [{ id: "direct-order" }];
  });
}

describe("GET /api/vendor/orders/console", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubOrders();
    batches.findActiveBatches.mockResolvedValue([] as never);
  });

  it("includes batch orders when the open batch is OPEN", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue({
      id: "b1",
      status: "OPEN",
    } as never);

    expect(await expectSuccess(await GET())).toEqual({
      activeBatch: { id: "b1", status: "OPEN" },
      batchOrders: [{ id: "batch-order", serialized: true }],
      directOrders: [{ id: "direct-order", serialized: true }],
      deliveryOrders: [{ id: "delivery-order", serialized: true }],
    });
    expect(batches.findOpenBatchByShopId).toHaveBeenCalledWith("shop-1", {
      include: { delivery_status: true },
    });
  });

  it("falls back to the first active batch and skips its orders when not OPEN", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue(null as never);
    batches.findActiveBatches.mockResolvedValue([
      { id: "b2", status: "LOCKED" },
    ] as never);

    const data = await expectSuccess<{
      activeBatch: unknown;
      batchOrders: unknown[];
    }>(await GET());

    expect(data.activeBatch).toEqual({ id: "b2", status: "LOCKED" });
    expect(data.batchOrders).toEqual([]);
    expect(db.order.findMany).toHaveBeenCalledTimes(2);
  });

  it("reports no active batch when there is none", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue(null as never);

    const data = await expectSuccess<{ activeBatch: unknown }>(await GET());

    expect(data.activeBatch).toBeNull();
  });

  it("returns the vendor-shop error response as is", async () => {
    vi.mocked(resolveVendorShop).mockResolvedValueOnce({
      error: errorJson("Shop not found", 400),
    });

    await expectError(await GET(), 400, "Shop not found");
  });

  it.each([
    [new Error("db down"), "db down"],
    ["boom", "Failed to get vendor order console"],
  ])("returns 500 on failure (%s)", async (error, message) => {
    batches.findOpenBatchByShopId.mockRejectedValue(error);

    await expectError(await GET(), 500, message);
  });
});
