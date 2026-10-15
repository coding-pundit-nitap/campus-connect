// Pricing tests. Expectations are derived from the schema,
// the checkout / cart UI and money invariants - not from order.service.ts.
import { describe, expect, it } from "vitest";

import { createOrderAction } from "../../../src/actions/orders/order-actions";
import {
  createBatchSlot,
  futureSlotTime,
  seedOpenBatch,
} from "../../factories";
import {
  paise,
  placeBatchOrder,
  placeDirectOrder,
  seedCheckout,
  services,
} from "../../helpers/orders";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

const SHOP_FEES = { default_delivery_fee: 10, direct_delivery_fee: 30 };

async function setPlatformFee(fee: number) {
  await testPrisma.platformSettings.update({
    where: { id: "default" },
    data: { platform_fee: fee },
  });
}

describe("orders spec: pricing", () => {
  it("an item's unit price is price minus a PERCENT discount (25% off 120 = 90)", async () => {
    const s = await seedCheckout({
      lines: [{ price: 120, discount: 25, quantity: 1 }],
    });
    const order = await placeDirectOrder(s);
    expect(paise(order.item_total)).toBe(9000);
  });

  it("item_total is the sum of discounted unit price x quantity over all lines", async () => {
    const s = await seedCheckout({
      lines: [
        { price: 120, discount: 25, quantity: 2 },
        { price: 80, quantity: 1 },
      ],
    });
    const order = await placeDirectOrder(s);
    expect(paise(order.item_total)).toBe(26000);
  });

  it("the stored order lines (unit price x quantity) add up to item_total", async () => {
    const s = await seedCheckout({
      lines: [
        { price: 33.33, discount: 10, quantity: 3 },
        { price: 19.99, discount: 5, quantity: 7 },
      ],
    });
    const order = await placeDirectOrder(s);
    const items = await testPrisma.orderItem.findMany({
      where: { order_id: order.id },
    });
    const linesPaise = items.reduce(
      (acc, i) => acc + paise(i.price) * i.quantity,
      0
    );
    expect(linesPaise).toBe(paise(order.item_total));
  });

  it("a direct-delivery order is charged the shop's direct_delivery_fee", async () => {
    const s = await seedCheckout({
      lines: [{ price: 100, quantity: 1 }],
      shop: SHOP_FEES,
    });
    const order = await placeDirectOrder(s);
    expect(order.is_direct_delivery).toBe(true);
    expect(paise(order.delivery_fee)).toBe(3000);
  });

  it("a batch-delivery order is charged the shop's default_delivery_fee", async () => {
    const s = await seedCheckout({
      lines: [{ price: 100, quantity: 1 }],
      shop: SHOP_FEES,
    });
    const batch = await seedOpenBatch({
      shop_id: s.shop.id,
      cutoffAt: new Date(Date.now() + 60 * 60_000),
    });
    const order = await placeBatchOrder(s, batch.id);
    expect(order.is_direct_delivery).toBe(false);
    expect(paise(order.delivery_fee)).toBe(1000);
  });

  it("the platform fee is the global PlatformSettings fee, snapshotted onto the order", async () => {
    await setPlatformFee(7.5);
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    const order = await placeDirectOrder(s);
    expect(paise(order.platform_fee)).toBe(750);

    await setPlatformFee(20);
    const reread = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(paise(reread.platform_fee)).toBe(750);
  });

  it("total_price = item_total + delivery_fee + platform_fee", async () => {
    await setPlatformFee(5);
    const s = await seedCheckout({
      lines: [
        { price: 120, discount: 25, quantity: 2 },
        { price: 80, quantity: 1 },
      ],
      shop: SHOP_FEES,
    });
    const order = await placeDirectOrder(s);
    expect(paise(order.total_price)).toBe(26000 + 3000 + 500);
  });

  it("the amounts the checkout page shows (getCartData) are exactly the amounts the order is charged", async () => {
    await setPlatformFee(4.99);
    const s = await seedCheckout({
      lines: [
        { price: 33.33, discount: 10, quantity: 3 },
        { price: 19.99, discount: 5, quantity: 7 },
      ],
      shop: SHOP_FEES,
    });
    asUser(s.buyer);
    const shown = await services().cartService.getCartData(s.cart.id);

    const order = await placeDirectOrder(s);

    expect(paise(shown.item_total)).toBe(paise(order.item_total));
    expect(paise(shown.direct_delivery_fee)).toBe(paise(order.delivery_fee));
    expect(paise(shown.platform_fee)).toBe(paise(order.platform_fee));
    // checkout-form/index.tsx: total = itemTotal + activeDeliveryFee + platformFee
    const shownTotal =
      shown.item_total + shown.direct_delivery_fee + shown.platform_fee;
    expect(shownTotal.toFixed(2)).toBe(Number(order.total_price).toFixed(2));
  });

  it("every stored money amount has at most 2 decimals", async () => {
    await setPlatformFee(3.33);
    const s = await seedCheckout({
      lines: [
        { price: 33.33, discount: 12.5, quantity: 3 },
        { price: 9.99, discount: 33, quantity: 11 },
      ],
      shop: { default_delivery_fee: 7.77, direct_delivery_fee: 11.11 },
    });
    asUser(s.buyer);
    const shown = await services().cartService.getCartData(s.cart.id);
    const order = await placeDirectOrder(s);
    const items = await testPrisma.orderItem.findMany({
      where: { order_id: order.id },
    });
    const isTwoDp = (v: unknown) =>
      Math.abs(Number(v) * 100 - Math.round(Number(v) * 100)) < 1e-6;
    for (const v of [
      order.item_total,
      order.delivery_fee,
      order.platform_fee,
      order.total_price,
      ...items.map((i) => i.price),
      shown.item_total,
      shown.total,
    ]) {
      expect(isTwoDp(v), `amount ${String(v)}`).toBe(true);
    }
  });

  it("checkout uses the product price in the DB at checkout time, not the price when it was added to the cart", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 2 }] });
    await testPrisma.product.update({
      where: { id: s.products[0].id },
      data: { price: 150 },
    });
    const order = await placeDirectOrder(s);
    expect(paise(order.item_total)).toBe(30000);
  });

  it("money fields sent by the client are ignored by createOrderAction", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    asUser(s.buyer);
    const res = await createOrderAction({
      shop_id: s.shop.id,
      payment_method: "CASH",
      delivery_address_id: s.address.id,
      is_direct_delivery: true,
      // forged client-side money
      ...({
        item_total: 1,
        total_price: 1,
        delivery_fee: 0,
        platform_fee: 0,
        price: 1,
      } as object),
    });
    expect(res.success).toBe(true);
    const order = await testPrisma.order.findFirstOrThrow({
      where: { user_id: s.buyer.id },
    });
    expect(paise(order.item_total)).toBe(10000);
    expect(paise(order.total_price)).toBe(
      10000 + paise(order.delivery_fee) + paise(order.platform_fee)
    );
  });

  it("money never goes negative - a discount above 100% cannot produce a negative price or total", async () => {
    await setPlatformFee(0);
    const s = await seedCheckout({
      lines: [
        { price: 100, discount: 150, quantity: 2 },
        { price: 50, quantity: 1 },
      ],
    });
    asUser(s.buyer);
    const shown = await services().cartService.getCartData(s.cart.id);
    expect(shown.item_total).toBeGreaterThanOrEqual(0);

    const order = await placeDirectOrder(s);
    const items = await testPrisma.orderItem.findMany({
      where: { order_id: order.id },
    });
    for (const i of items) expect(Number(i.price)).toBeGreaterThanOrEqual(0);
    expect(Number(order.item_total)).toBeGreaterThanOrEqual(0);
    expect(Number(order.total_price)).toBeGreaterThanOrEqual(0);
    // the over-discounted item is free, the other is charged in full
    expect(paise(order.item_total)).toBe(5000);
  });

  it("a batch order placed via requested_delivery_time is charged the batch fee, not the direct fee", async () => {
    const s = await seedCheckout({
      lines: [{ price: 100, quantity: 1 }],
      shop: SHOP_FEES,
    });
    const { at, cutoffMinutes } = futureSlotTime(120);
    await createBatchSlot({
      shop_id: s.shop.id,
      cutoff_time_minutes: cutoffMinutes,
    });
    asUser(s.buyer);
    const res = await createOrderAction({
      shop_id: s.shop.id,
      payment_method: "CASH",
      delivery_address_id: s.address.id,
      is_direct_delivery: false,
      requested_delivery_time: at,
    });
    expect(res.success, JSON.stringify(res)).toBe(true);
    const order = await testPrisma.order.findFirstOrThrow({
      where: { user_id: s.buyer.id },
    });
    expect(paise(order.delivery_fee)).toBe(1000);
  });
});
