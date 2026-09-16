// Relative imports, not the "@/" alias - vite-tsconfig-paths does not cover
// tests/**/*.ts (see tests/factories/index.ts for the full rationale).
import { afterEach, describe, expect, it, vi } from "vitest";

import { createContainer } from "../../../src/di/container";
import * as batchProgressPublisher from "../../../src/lib/batch-progress-publisher";
import { createShop, createUser } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("batch status-transition methods publish realtime progress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lockBatch publishes the fresh batch state after locking an OPEN batch", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 500,
    });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60_000),
        status: "OPEN",
        collective_total: 600,
        min_order_value_snapshot: 500,
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.lockBatch(batch.id, shop.id);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: batch.id,
      shopId: shop.id,
      status: "LOCKED",
      collectiveTotal: 600,
      minRequired: 500,
    });
  });

  it("forceLockBatch publishes the fresh batch state after force-locking a PENDING_REVIEW batch", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 500,
    });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() - 60_000),
        status: "PENDING_REVIEW",
        collective_total: 300,
        min_order_value_snapshot: 500,
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.forceLockBatch(batch.id, shop.id);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: batch.id,
      shopId: shop.id,
      status: "LOCKED",
      collectiveTotal: 300,
      minRequired: 500,
    });
  });

  it("cancelBatch publishes the fresh batch state exactly once, not once per order", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() - 60_000),
        status: "LOCKED",
        collective_total: 250,
        min_order_value_snapshot: null,
      },
    });

    const buyer1 = await createUser();
    const buyer2 = await createUser();
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-CANCEL01",
        user_id: buyer1.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 125,
        total_price: 125,
        payment_method: "CASH",
        order_status: "BATCHED",
        delivery_address_snapshot: {},
      },
    });
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-CANCEL02",
        user_id: buyer2.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 125,
        total_price: 125,
        payment_method: "ONLINE",
        order_status: "BATCHED",
        delivery_address_snapshot: {},
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.cancelBatch(batch.id, "vendor cancelled");

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: batch.id,
      shopId: shop.id,
      status: "CANCELLED",
      collectiveTotal: 250,
      minRequired: null,
    });
  });
});
