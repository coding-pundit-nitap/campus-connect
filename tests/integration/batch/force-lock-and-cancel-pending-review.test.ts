import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("resolving a PENDING_REVIEW batch", () => {
  it("forceLockBatch transitions PENDING_REVIEW to LOCKED and batches its NEW orders", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() - 60_000),
        status: "PENDING_REVIEW",
        collective_total: 50,
        min_order_value_snapshot: 1000,
      },
    });
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST03",
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 50,
        total_price: 50,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.forceLockBatch(batch.id, shop.id);

    const updated = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(updated!.status).toBe("LOCKED");
    const order = await testPrisma.order.findFirst({
      where: { batch_id: batch.id },
    });
    expect(order!.order_status).toBe("BATCHED");
    expect(order!.delivery_otp).not.toBeNull();
  });

  it("forceLockBatch rejects a batch that isn't PENDING_REVIEW", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: { shop_id: shop.id, cutoff_time: new Date(), status: "OPEN" },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await expect(
      batchService.forceLockBatch(batch.id, shop.id)
    ).rejects.toThrow("Only PENDING_REVIEW batches can be force-locked");
  });

  it("cancelBatch accepts PENDING_REVIEW as a valid source status", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(),
        status: "PENDING_REVIEW",
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    const result = await batchService.cancelBatch(batch.id, "Owner declined");

    const updated = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(updated!.status).toBe("CANCELLED");
    expect(result.cancelled_orders).toBe(0);
  });
});
