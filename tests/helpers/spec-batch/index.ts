// Shared scenario builders for the rule-based batch tests in
// tests/integration/spec/batch. Relative imports only (see
// tests/factories/index.ts for why the "@/" alias is not used here).
import Redis from "ioredis";

import { createOrderAction } from "../../../src/actions/orders/order-actions";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createBatchSlot,
  createProduct,
  createShop,
  createUser,
  createUserAddress,
  futureSlotTime,
} from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

export interface BatchShopOptions {
  /** Shop.batch_min_order_value; null/undefined = feature off. */
  min?: number | null;
  deliveryFee?: number;
  offsetMinutes?: number;
}

/**
 * A shop open all day with one active batch slot `offsetMinutes` from now,
 * its owner, and the slot's cutoff instant `at`.
 */
export async function seedBatchShop(opts: BatchShopOptions = {}) {
  const { at, cutoffMinutes } = futureSlotTime(opts.offsetMinutes ?? 120);
  const shop = await createShop({
    opening: "00:00",
    closing: "23:59",
    min_order_value: 0,
    default_delivery_fee: opts.deliveryFee ?? 0,
    batch_min_order_value: opts.min ?? null,
  });
  const owner = await createUser({ shop_id: shop.id });
  await createBatchSlot({
    shop_id: shop.id,
    cutoff_time_minutes: cutoffMinutes,
    is_active: true,
  });
  return { shop, owner, at };
}

/** A fresh customer with an address and a one-line cart at `shopId`. */
export async function seedCustomerCart(
  shopId: string,
  { price = 100, quantity = 1 }: { price?: number; quantity?: number } = {}
) {
  const user = await createUser();
  const address = await createUserAddress({ user_id: user.id });
  const product = await createProduct({
    shop_id: shopId,
    price,
    stock_quantity: 1000,
  });
  await testPrisma.cart.create({
    data: {
      user_id: user.id,
      shop_id: shopId,
      items: { create: [{ product_id: product.id, quantity }] },
    },
  });
  return { user, address, product };
}

/** Places an order through the user-facing server action, signed in as a new customer. */
export async function placeOrder(
  shopId: string,
  at: Date,
  opts: { price?: number; quantity?: number; payment?: PaymentMethod } = {}
) {
  const { user, address } = await seedCustomerCart(shopId, opts);
  asUser(user);
  const res = await createOrderAction({
    shop_id: shopId,
    payment_method: opts.payment ?? "CASH",
    delivery_address_id: address.id,
    requested_delivery_time: at,
    // ONLINE checkout requires a UPI transaction reference (10-35 alnum).
    upi_transaction_id:
      opts.payment === "ONLINE"
        ? `UPI${Date.now()}${user.id}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 35)
        : undefined,
  });
  if (!res.success) {
    throw new Error(`placeOrder failed: ${res.details}`);
  }
  const order = await testPrisma.order.findFirstOrThrow({
    where: { user_id: user.id, shop_id: shopId },
    orderBy: { created_at: "desc" },
  });
  return { user, order };
}

export async function batchOf(batchId: string) {
  return testPrisma.batch.findUniqueOrThrow({ where: { id: batchId } });
}

export async function totalOf(batchId: string): Promise<number> {
  return Number((await batchOf(batchId)).collective_total);
}

/** Sum of item_total over the batch's orders that aren't CANCELLED. */
export async function liveItemSum(batchId: string): Promise<number> {
  const agg = await testPrisma.order.aggregate({
    where: { batch_id: batchId, order_status: { not: "CANCELLED" } },
    _sum: { item_total: true },
  });
  return Number(agg._sum.item_total ?? 0);
}

/** Moves a batch's cutoff into the past, as if the clock had passed it. */
export async function expireBatch(batchId: string) {
  return testPrisma.batch.update({
    where: { id: batchId },
    data: { cutoff_time: new Date(Date.now() - 60_000) },
  });
}

/**
 * Subscribes to a shop's batch-progress channel and collects the messages
 * for `batchId` (pub/sub is not DB-scoped, so we filter on the unique cuid).
 */
export async function captureProgress(shopId: string, batchId: string) {
  const sub = new Redis(process.env.REDIS_URL!);
  const messages: Record<string, unknown>[] = [];
  sub.on("message", (_channel, raw: string) => {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    if (msg.batchId === batchId) messages.push(msg);
  });
  await sub.subscribe(`shop:${shopId}:batch-progress`);
  return {
    messages,
    async settle() {
      await new Promise((r) => setTimeout(r, 150));
      await sub.quit();
      return messages;
    },
  };
}
