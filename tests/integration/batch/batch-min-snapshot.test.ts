import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createBatchSlot, createShop, futureSlotTime } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("batch_min_order_value snapshot on creation", () => {
  it("ensureNextOpenBatch copies the shop's batch_min_order_value onto the new batch", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 500,
    });
    const { cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.ensureNextOpenBatch(shop.id);

    const batch = await testPrisma.batch.findFirst({
      where: { shop_id: shop.id },
    });
    expect(batch).not.toBeNull();
    expect(Number(batch!.min_order_value_snapshot)).toBe(500);
    expect(Number(batch!.collective_total)).toBe(0);
  });

  it("ensureNextOpenBatch leaves the snapshot null when the shop has no batch_min_order_value", async () => {
    const shop = await createShop({ accepting_orders: true });
    const { cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.ensureNextOpenBatch(shop.id);

    const batch = await testPrisma.batch.findFirst({
      where: { shop_id: shop.id },
    });
    expect(batch!.min_order_value_snapshot).toBeNull();
  });
});
