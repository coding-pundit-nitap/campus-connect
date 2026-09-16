// Relative imports, not the "@/" alias - vite-tsconfig-paths does not cover
// tests/**/*.ts (see tests/factories/index.ts for the full rationale).
import { afterEach, describe, expect, it, vi } from "vitest";

import { updateOrderStatusAdminAction } from "../../../src/actions/admin/order-actions";
import * as batchProgressPublisher from "../../../src/lib/batch-progress-publisher";
import { createShop, createUser } from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("updateOrderStatusAdminAction and Batch.collective_total", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("decrements the batch total and publishes when an admin cancels a batched order", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 500,
    });
    const buyer = await createUser();
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60_000),
        status: "OPEN",
        collective_total: 150,
        min_order_value_snapshot: 500,
      },
    });
    const order = await testPrisma.order.create({
      data: {
        display_id: "NITAP-ADMIN01",
        user_id: buyer.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 150,
        total_price: 150,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    asUser(admin);
    const result = await updateOrderStatusAdminAction({
      order_id: order.id,
      order_status: "CANCELLED",
    });

    expect(result.data?.order_status).toBe("CANCELLED");

    const updatedBatch = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(Number(updatedBatch!.collective_total)).toBe(0);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith({
      batchId: batch.id,
      shopId: shop.id,
      status: "OPEN",
      collectiveTotal: 0,
      minRequired: 500,
    });
  });

  it("does not double-decrement the batch total when the order was already CANCELLED", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const shop = await createShop({ accepting_orders: true });
    const buyer = await createUser();
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60_000),
        status: "OPEN",
        collective_total: 0,
        min_order_value_snapshot: null,
      },
    });
    const order = await testPrisma.order.create({
      data: {
        display_id: "NITAP-ADMIN02",
        user_id: buyer.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 150,
        total_price: 150,
        payment_method: "CASH",
        order_status: "CANCELLED",
        payment_status: "CANCELLED",
        delivery_address_snapshot: {},
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    asUser(admin);
    const result = await updateOrderStatusAdminAction({
      order_id: order.id,
      order_status: "CANCELLED",
    });

    expect(result.data?.order_status).toBe("CANCELLED");

    const updatedBatch = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    // Already CANCELLED before this call - collective_total must stay at 0,
    // not go negative from a second decrement.
    expect(Number(updatedBatch!.collective_total)).toBe(0);
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it("does not touch collective_total for a non-CANCELLED admin status change", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const shop = await createShop({ accepting_orders: true });
    const buyer = await createUser();
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60_000),
        status: "LOCKED",
        collective_total: 200,
        min_order_value_snapshot: null,
      },
    });
    const order = await testPrisma.order.create({
      data: {
        display_id: "NITAP-ADMIN03",
        user_id: buyer.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 200,
        total_price: 200,
        payment_method: "CASH",
        order_status: "BATCHED",
        delivery_address_snapshot: {},
      },
    });

    const publishSpy = vi
      .spyOn(batchProgressPublisher, "publishBatchProgress")
      .mockResolvedValue(undefined);

    asUser(admin);
    const result = await updateOrderStatusAdminAction({
      order_id: order.id,
      order_status: "OUT_FOR_DELIVERY",
    });

    expect(result.data?.order_status).toBe("OUT_FOR_DELIVERY");

    const updatedBatch = await testPrisma.batch.findUnique({
      where: { id: batch.id },
    });
    expect(Number(updatedBatch!.collective_total)).toBe(200);
    expect(publishSpy).not.toHaveBeenCalled();
  });
});
