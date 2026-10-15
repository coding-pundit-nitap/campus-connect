// Tests for Batch.collective_total (spec:
// docs/superpowers/specs/2026-09-14-batch-collective-minimum-order-design.md,
// "Order placement / cancellation" and "Error handling & correctness").
// Invariant under test: collective_total == sum(item_total) of the batch's
// orders that are not CANCELLED.
import { describe, expect, it } from "vitest";

import {
  updateOrderStatusAdminAction,
  updatePaymentStatusAction,
} from "../../../../src/actions/admin/order-actions";
import {
  batchUpdateOrderStatusAction,
  cancelOrderAction,
  updateOrderStatusAction,
} from "../../../../src/actions/orders/order-actions";
import { cancelBatchAction } from "../../../../src/actions/shop/batch-actions";
import { rejectOrderAction } from "../../../../src/actions/shop/order-management-actions";
import { createContainer } from "../../../../src/di/container";
import { createUser } from "../../../factories";
import {
  batchOf,
  captureProgress,
  liveItemSum,
  placeOrder,
  seedBatchShop,
  seedCustomerCart,
  totalOf,
} from "../../../helpers/spec-batch";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

describe("collective_total increments on placement", () => {
  it("a batch created by the first order snapshots the shop threshold and starts its total from that order only", async () => {
    const { shop, at } = await seedBatchShop({ min: 750 });
    const { order } = await placeOrder(shop.id, at, { price: 120 });

    const batch = await batchOf(order.batch_id!);
    expect(Number(batch.min_order_value_snapshot)).toBe(750);
    expect(Number(batch.collective_total)).toBe(120);
    expect(batch.status).toBe("OPEN");
  });

  it("placing an order adds its item_total (not delivery/platform fees) to the batch total", async () => {
    const { shop, at } = await seedBatchShop({ min: 1000, deliveryFee: 25 });
    const a = await placeOrder(shop.id, at, { price: 150, quantity: 2 });
    const b = await placeOrder(shop.id, at, { price: 80 });

    expect(a.order.batch_id).toBe(b.order.batch_id);
    expect(Number(a.order.total_price)).toBeGreaterThan(
      Number(a.order.item_total)
    );
    expect(await totalOf(a.order.batch_id!)).toBe(300 + 80);
  });

  it("an order is accepted even though the batch is still below its collective minimum", async () => {
    const { shop, at } = await seedBatchShop({ min: 100_000 });
    const { order } = await placeOrder(shop.id, at, { price: 50 });

    expect(order.order_status).toBe("NEW");
    expect(order.batch_id).not.toBeNull();
  });
});

describe("collective_total decrements on every cancel/refund path", () => {
  async function twoOrderBatch(payment: "CASH" | "ONLINE" = "CASH") {
    const ctx = await seedBatchShop({ min: 1000 });
    const keep = await placeOrder(ctx.shop.id, ctx.at, { price: 70 });
    const target = await placeOrder(ctx.shop.id, ctx.at, {
      price: 130,
      payment,
    });
    expect(await totalOf(target.order.batch_id!)).toBe(200);
    return { ...ctx, keep, target, batchId: target.order.batch_id! };
  }

  it("a user cancelling their own order decrements the batch total by its item_total", async () => {
    const { target, batchId } = await twoOrderBatch();
    asUser(target.user);
    const res = await cancelOrderAction(target.order.id);

    expect(res.success).toBe(true);
    expect(await totalOf(batchId)).toBe(70);
    expect(await totalOf(batchId)).toBe(await liveItemSum(batchId));
  });

  it("the shop owner cancelling an order decrements the batch total", async () => {
    const { owner, target, batchId } = await twoOrderBatch();
    asUser(owner);
    const res = await updateOrderStatusAction({
      order_id: target.order.id,
      status: "CANCELLED",
    });

    expect(res.success).toBe(true);
    expect(await totalOf(batchId)).toBe(70);
  });

  it("the shop owner rejecting an order decrements the batch total", async () => {
    const { owner, target, batchId } = await twoOrderBatch("ONLINE");
    asUser(owner);
    const res = await rejectOrderAction(target.order.id, "out of stock");

    expect(res.success).toBe(true);
    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: target.order.id },
    });
    expect(order.order_status).toBe("CANCELLED");
    expect(order.payment_status).toBe("REFUNDED");
    expect(await totalOf(batchId)).toBe(70);
  });

  it("the owner bulk-cancelling orders decrements the batch total once per order", async () => {
    const { owner, keep, target, batchId } = await twoOrderBatch();
    asUser(owner);
    const res = await batchUpdateOrderStatusAction({
      orderIds: [keep.order.id, target.order.id],
      status: "CANCELLED",
    });

    expect(res.success).toBe(true);
    expect(await totalOf(batchId)).toBe(0);
  });

  it("an admin cancelling an order decrements the batch total", async () => {
    const { target, batchId } = await twoOrderBatch();
    const admin = await createUser({ role: "ADMIN" });
    asUser(admin);
    const res = await updateOrderStatusAdminAction({
      order_id: target.order.id,
      order_status: "CANCELLED",
    });

    expect(res.success).toBe(true);
    expect(await totalOf(batchId)).toBe(70);
  });

  it("an admin status override that reinstates a cancelled order adds it back to the total", async () => {
    const { target, batchId } = await twoOrderBatch();
    const admin = await createUser({ role: "ADMIN" });
    asUser(admin);
    await updateOrderStatusAdminAction({
      order_id: target.order.id,
      order_status: "CANCELLED",
    });
    expect(await totalOf(batchId)).toBe(70);

    const res = await updateOrderStatusAdminAction({
      order_id: target.order.id,
      order_status: "NEW",
    });
    expect(res.success).toBe(true);
    expect(await totalOf(batchId)).toBe(200);
    expect(await totalOf(batchId)).toBe(await liveItemSum(batchId));
  });

  it("an admin override between two active statuses leaves the total unchanged", async () => {
    const { target, batchId } = await twoOrderBatch();
    const admin = await createUser({ role: "ADMIN" });
    asUser(admin);
    await updateOrderStatusAdminAction({
      order_id: target.order.id,
      order_status: "BATCHED",
    });
    expect(await totalOf(batchId)).toBe(200);
  });

  it("cancelling a batch removes every cancelled order from its total", async () => {
    const { owner, batchId } = await twoOrderBatch();
    await testPrisma.batch.update({
      where: { id: batchId },
      data: { status: "PENDING_REVIEW" },
    });
    asUser(owner);
    const res = await cancelBatchAction(batchId);

    expect(res.success).toBe(true);
    const batch = await batchOf(batchId);
    expect(batch.status).toBe("CANCELLED");
    expect(Number(batch.collective_total)).toBe(0);
    expect(Number(batch.collective_total)).toBe(await liveItemSum(batchId));
  });

  it("cancelling a batch publishes its new progress on the shop's channel", async () => {
    const { shop, owner, batchId } = await twoOrderBatch();
    await testPrisma.batch.update({
      where: { id: batchId },
      data: { status: "PENDING_REVIEW" },
    });
    const cap = await captureProgress(shop.id, batchId);
    asUser(owner);
    await cancelBatchAction(batchId);
    const messages = await cap.settle();

    expect(messages.at(-1)).toMatchObject({
      batchId,
      shopId: shop.id,
      status: "CANCELLED",
      collectiveTotal: 0,
      minRequired: 1000,
    });
  });

  it("marking an order's payment FAILED keeps the order active and counted; only an explicit cancel removes it", async () => {
    const { target, batchId } = await twoOrderBatch();
    const admin = await createUser({ role: "ADMIN" });
    asUser(admin);
    await updatePaymentStatusAction({
      order_id: target.order.id,
      payment_status: "FAILED",
    });

    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: target.order.id },
    });
    expect(order.order_status).toBe("NEW");
    expect(await totalOf(batchId)).toBe(200);
  });

  it("a second cancellation of the same order does not decrement again", async () => {
    const { owner, target, batchId } = await twoOrderBatch();
    asUser(target.user);
    await cancelOrderAction(target.order.id);
    expect(await totalOf(batchId)).toBe(70);

    asUser(owner);
    const refused = async (fn: () => Promise<{ success: boolean }>) =>
      fn().then(
        (r) => !r.success,
        () => true
      );

    expect(await refused(() => rejectOrderAction(target.order.id))).toBe(true);
    expect(
      await refused(() =>
        updateOrderStatusAction({
          order_id: target.order.id,
          status: "CANCELLED",
        })
      )
    ).toBe(true);
    expect(await totalOf(batchId)).toBe(70);
  });
});

describe("concurrency", () => {
  it("concurrent placements into one batch lose no increments", async () => {
    const { shop, at } = await seedBatchShop({ min: 5000 });
    // First order creates the batch; the rest race into it.
    const first = await placeOrder(shop.id, at, { price: 10 });
    const batchId = first.order.batch_id!;

    const prices = [11, 23, 37, 41, 59, 61, 73, 89];
    const carts = await Promise.all(
      prices.map((price) => seedCustomerCart(shop.id, { price }))
    );
    const { orderService } = createContainer({ prisma: testPrisma });
    const results = await Promise.allSettled(
      carts.map((c) =>
        orderService.createOrderFromCart(
          c.user.id,
          shop.id,
          "CASH",
          c.address.id,
          undefined,
          at
        )
      )
    );

    const placed = await testPrisma.order.aggregate({
      where: { batch_id: batchId },
      _sum: { item_total: true },
      _count: true,
    });
    expect(placed._count).toBe(
      1 + results.filter((r) => r.status === "fulfilled").length
    );
    expect(await totalOf(batchId)).toBe(Number(placed._sum.item_total));
  });

  it("concurrent cancellations of different orders in one batch lose no decrements", async () => {
    const { shop, at } = await seedBatchShop({ min: 5000 });
    const placed = [];
    for (const price of [10, 20, 30, 40, 50, 60]) {
      placed.push(await placeOrder(shop.id, at, { price }));
    }
    const batchId = placed[0].order.batch_id!;
    expect(await totalOf(batchId)).toBe(210);

    const admin = await createUser({ role: "ADMIN" });
    asUser(admin);
    const toCancel = placed.slice(0, 5);
    const results = await Promise.all(
      toCancel.map((p) =>
        updateOrderStatusAdminAction({
          order_id: p.order.id,
          order_status: "CANCELLED",
        })
      )
    );

    expect(results.every((r) => r.success)).toBe(true);
    expect(await totalOf(batchId)).toBe(60);
    expect(await totalOf(batchId)).toBe(await liveItemSum(batchId));
  });
});
