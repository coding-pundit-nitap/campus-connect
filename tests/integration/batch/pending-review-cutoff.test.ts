import { afterEach, describe, expect, it, vi } from "vitest";

import { createContainer } from "../../../src/di/container";
import * as batchProgressPublisher from "../../../src/lib/batch-progress-publisher";
import { createShop, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("autoCloseExpiredBatches with a collective minimum", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("transitions an under-threshold expired batch to PENDING_REVIEW instead of LOCKED", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 10000,
    });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 10000,
      },
    });
    const a = await seedCartForShop(shop);
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST01",
        user_id: a.user.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(updated!.status).toBe("PENDING_REVIEW");

    const order = await testPrisma.order.findFirst({
      where: { batch_id: batch.id },
    });
    expect(order!.order_status).toBe("NEW");

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: batch.id,
      shopId: shop.id,
      status: "PENDING_REVIEW",
      collectiveTotal: 100,
      minRequired: 10000,
    });
  });

  it("locks an at-or-above-threshold expired batch exactly as before", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 50,
    });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 50,
      },
    });
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST02",
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(updated!.status).toBe("LOCKED");

    const order = await testPrisma.order.findFirst({
      where: { batch_id: batch.id },
    });
    expect(order!.order_status).toBe("BATCHED");

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: batch.id,
      shopId: shop.id,
      status: "LOCKED",
      collectiveTotal: 100,
      minRequired: 50,
    });
  });

  it("locks an expired batch unconditionally when no collective minimum is configured", async () => {
    const shop = await createShop({ accepting_orders: true });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 0,
        min_order_value_snapshot: null,
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(updated!.status).toBe("LOCKED");
  });

  it("publishes once per affected batch when both a LOCKED and a PENDING_REVIEW batch expire in the same sweep", async () => {
    const shopBelow = await createShop({
      accepting_orders: true,
      batch_min_order_value: 10000,
    });
    const shopAbove = await createShop({
      accepting_orders: true,
      batch_min_order_value: 50,
    });
    const pastCutoff = new Date(Date.now() - 60_000);

    const belowBatch = await testPrisma.batch.create({
      data: {
        shop_id: shopBelow.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 10000,
      },
    });
    const aboveBatch = await testPrisma.batch.create({
      data: {
        shop_id: shopAbove.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 50,
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: belowBatch.id,
      shopId: shopBelow.id,
      status: "PENDING_REVIEW",
      collectiveTotal: 100,
      minRequired: 10000,
    });
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: aboveBatch.id,
      shopId: shopAbove.id,
      status: "LOCKED",
      collectiveTotal: 100,
      minRequired: 50,
    });
  });
});
