// Tests for resolving PENDING_REVIEW batches and for batch status
// gating new orders (spec: "Cutoff handling" owner actions, "No new orders on
// PENDING_REVIEW/LOCKED").
import { describe, expect, it } from "vitest";

import {
  cancelOrderAction,
  createOrderAction,
} from "../../../../src/actions/orders/order-actions";
import {
  cancelBatchAction,
  forceLockBatchAction,
} from "../../../../src/actions/shop/batch-actions";
import {
  startBatchDeliveryAction,
  unlockBatchAction,
} from "../../../../src/actions/vendor/batch-actions";
import {
  batchOf,
  liveItemSum,
  placeOrder,
  seedBatchShop,
  seedCustomerCart,
  totalOf,
} from "../../../helpers/spec-batch";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

async function pendingReviewBatch() {
  const ctx = await seedBatchShop({ min: 1000 });
  const cash = await placeOrder(ctx.shop.id, ctx.at, { price: 100 });
  const online = await placeOrder(ctx.shop.id, ctx.at, {
    price: 150,
    payment: "ONLINE",
  });
  const batchId = cash.order.batch_id!;
  await testPrisma.batch.update({
    where: { id: batchId },
    data: { status: "PENDING_REVIEW" },
  });
  return { ...ctx, cash, online, batchId };
}

async function settle<T>(fn: () => Promise<T>) {
  try {
    const res = (await fn()) as { success?: boolean; details?: string };
    return { ok: res?.success !== false, message: res?.details ?? "" };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

describe("forceLock", () => {
  it("force-locking a PENDING_REVIEW batch locks it and moves its orders into the normal delivery flow", async () => {
    const { owner, batchId } = await pendingReviewBatch();
    asUser(owner);
    const res = await forceLockBatchAction(batchId);

    expect(res.success).toBe(true);
    expect((await batchOf(batchId)).status).toBe("LOCKED");
    const orders = await testPrisma.order.findMany({
      where: { batch_id: batchId },
    });
    expect(orders.map((o) => o.order_status)).toEqual(["BATCHED", "BATCHED"]);
    expect(orders.every((o) => o.delivery_otp)).toBe(true);
    expect(await totalOf(batchId)).toBe(250);
  });

  it("force-lock is refused for a batch that is not PENDING_REVIEW", async () => {
    const { shop, owner, at } = await seedBatchShop({ min: 1000 });
    const { order } = await placeOrder(shop.id, at);
    asUser(owner);
    const res = await settle(() => forceLockBatchAction(order.batch_id!));

    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/only pending_review/i);
    expect((await batchOf(order.batch_id!)).status).toBe("OPEN");
  });

  it("another shop's owner cannot force-lock or cancel the batch", async () => {
    const { batchId } = await pendingReviewBatch();
    const other = await seedBatchShop();
    asUser(other.owner);

    expect((await settle(() => forceLockBatchAction(batchId))).ok).toBe(false);
    expect((await settle(() => cancelBatchAction(batchId))).ok).toBe(false);
    expect((await batchOf(batchId)).status).toBe("PENDING_REVIEW");
    expect(await totalOf(batchId)).toBe(250);
  });
});

describe("cancelling a PENDING_REVIEW batch", () => {
  it("cancels the batch and every order; online payments are refunded", async () => {
    const { owner, cash, online, batchId } = await pendingReviewBatch();
    asUser(owner);
    const res = await cancelBatchAction(batchId);

    expect(res.success).toBe(true);
    expect((await batchOf(batchId)).status).toBe("CANCELLED");
    const c = await testPrisma.order.findUniqueOrThrow({
      where: { id: cash.order.id },
    });
    const o = await testPrisma.order.findUniqueOrThrow({
      where: { id: online.order.id },
    });
    expect(c.order_status).toBe("CANCELLED");
    expect(c.payment_status).toBe("CANCELLED");
    expect(o.order_status).toBe("CANCELLED");
    expect(o.payment_status).toBe("REFUNDED");
    expect(await totalOf(batchId)).toBe(0);
  });

  it("an order already cancelled before the batch cancel is not decremented twice", async () => {
    const { owner, cash, batchId } = await pendingReviewBatch();
    asUser(cash.user);
    await cancelOrderAction(cash.order.id);
    expect(await totalOf(batchId)).toBe(150);

    asUser(owner);
    await cancelBatchAction(batchId);
    expect(await totalOf(batchId)).toBe(0);
  });
});

describe("lifecycle transitions never revive a cancelled order", () => {
  it("force-locking keeps an order cancelled during review CANCELLED", async () => {
    const { owner, cash, batchId } = await pendingReviewBatch();
    asUser(cash.user);
    await cancelOrderAction(cash.order.id);

    asUser(owner);
    await forceLockBatchAction(batchId);

    const c = await testPrisma.order.findUniqueOrThrow({
      where: { id: cash.order.id },
    });
    expect(c.order_status).toBe("CANCELLED");
    expect(await totalOf(batchId)).toBe(await liveItemSum(batchId));
  });

  it("unlocking and starting delivery keep a cancelled order CANCELLED", async () => {
    const { owner, cash, online, batchId } = await pendingReviewBatch();
    asUser(owner);
    await forceLockBatchAction(batchId);
    // Owner cancels one batched order.
    await testPrisma.order.update({
      where: { id: cash.order.id },
      data: { order_status: "CANCELLED" },
    });
    await testPrisma.batch.update({
      where: { id: batchId },
      data: { collective_total: 150 },
    });

    await unlockBatchAction(batchId);
    let c = await testPrisma.order.findUniqueOrThrow({
      where: { id: cash.order.id },
    });
    expect(c.order_status).toBe("CANCELLED");

    await testPrisma.batch.update({
      where: { id: batchId },
      data: { status: "LOCKED" },
    });
    await startBatchDeliveryAction(batchId);
    c = await testPrisma.order.findUniqueOrThrow({
      where: { id: cash.order.id },
    });
    const o = await testPrisma.order.findUniqueOrThrow({
      where: { id: online.order.id },
    });
    expect(c.order_status).toBe("CANCELLED");
    expect(o.order_status).toBe("OUT_FOR_DELIVERY");
  });
});

describe("no new orders into a batch that isn't OPEN", () => {
  for (const status of ["PENDING_REVIEW", "LOCKED"] as const) {
    it(`an order for a ${status} batch's slot is rejected with a clear error and nothing changes`, async () => {
      const { shop, at, batchId } = await pendingReviewBatch();
      await testPrisma.batch.update({
        where: { id: batchId },
        data: { status },
      });
      const before = await testPrisma.order.count();
      const { user, address } = await seedCustomerCart(shop.id);
      asUser(user);
      const res = await createOrderAction({
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        requested_delivery_time: at,
      });

      expect(res.success).toBe(false);
      expect(res.details).toMatch(/batch/i);
      expect(res.details).not.toMatch(/failed to create order/i);
      expect(await testPrisma.order.count()).toBe(before);
      expect(await totalOf(batchId)).toBe(250);
      expect(
        await testPrisma.cartItem.count({
          where: { cart: { user_id: user.id } },
        })
      ).toBe(1);
    });

    it(`an order naming a ${status} batch by id is rejected with a clear error`, async () => {
      const { shop, batchId } = await pendingReviewBatch();
      await testPrisma.batch.update({
        where: { id: batchId },
        data: { status },
      });
      const { user, address } = await seedCustomerCart(shop.id);
      asUser(user);
      const res = await createOrderAction({
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        batch_id: batchId,
      });

      expect(res.success).toBe(false);
      expect(res.details).toMatch(/no longer accepting orders/i);
      expect(await totalOf(batchId)).toBe(250);
    });
  }
});
