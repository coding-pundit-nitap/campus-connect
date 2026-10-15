// Vendor earnings tests.
import { describe, expect, it } from "vitest";

import {
  acceptOrderAction,
  startDirectDeliveryAction,
  verifyDeliveryOtpAction,
} from "../../../../src/actions/shop/order-management-actions";
import { GET } from "../../../../src/app/api/vendor/earnings/route";
import { createShop, createUser } from "../../../factories";
import { makeRequest, readJson } from "../../../helpers/http";
import {
  createOrderRow,
  paise,
  placeDirectOrder,
  seedCheckout,
} from "../../../helpers/spec-orders";
import { asAnonymous, asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

type Earnings = {
  customersPaid: number;
  platformFee: number;
  vendorEarnings: number;
  orderCount: number;
  cash: { earnings: number; platformFeeOwed: number; orderCount: number };
  online: { earnings: number; orderCount: number };
};

async function getEarnings(period = "today") {
  const res = await GET(makeRequest(`/api/vendor/earnings?period=${period}`));
  return readJson<{ success: boolean; data: Earnings }>(res);
}

async function seedShop() {
  const shop = await createShop({ opening: "00:00", closing: "23:59" });
  const owner = await createUser({ shop_id: shop.id });
  const buyer = await createUser();
  return { shop, owner, buyer };
}

describe("orders spec: vendor earnings", () => {
  it("vendor earnings = item_total + delivery_fee; the platform fee is on top (customersPaid = earnings + platformFee)", async () => {
    const { shop, owner, buyer } = await seedShop();
    const now = new Date();
    await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "COMPLETED",
      payment_method: "CASH",
      item_total: 260.5,
      delivery_fee: 30,
      platform_fee: 5,
      actual_delivery_time: now,
    });
    await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "COMPLETED",
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
      item_total: 99.99,
      delivery_fee: 10,
      platform_fee: 4.99,
      actual_delivery_time: now,
    });
    asUser(owner);
    const { status, body } = await getEarnings();
    expect(status).toBe(200);
    const d = body.data;
    expect(paise(d.vendorEarnings)).toBe(26050 + 3000 + 9999 + 1000);
    expect(paise(d.platformFee)).toBe(500 + 499);
    expect(paise(d.customersPaid)).toBe(
      paise(d.vendorEarnings) + paise(d.platformFee)
    );
    expect(d.orderCount).toBe(2);
  });

  it("only COMPLETED orders of the caller's own shop delivered in the period count", async () => {
    const { shop, owner, buyer } = await seedShop();
    const other = await createShop();
    const now = new Date();
    const lastMonth = new Date(Date.now() - 40 * 24 * 3600_000);
    const counted = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "COMPLETED",
      item_total: 100,
      actual_delivery_time: now,
    });
    for (const order_status of [
      "NEW",
      "BATCHED",
      "OUT_FOR_DELIVERY",
      "DELIVERY_FAILED",
      "CANCELLED",
      "RESCHEDULED",
    ] as const) {
      await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status,
        item_total: 1000,
        actual_delivery_time: now,
      });
    }
    await createOrderRow({
      shop_id: other.id,
      order_status: "COMPLETED",
      item_total: 1000,
      actual_delivery_time: now,
    });
    await createOrderRow({
      shop_id: shop.id,
      order_status: "COMPLETED",
      item_total: 1000,
      actual_delivery_time: lastMonth,
    });
    asUser(owner);
    const { body } = await getEarnings("today");
    expect(body.data.orderCount).toBe(1);
    expect(paise(body.data.vendorEarnings)).toBe(paise(counted.item_total));
  });

  it("cash in drawer = cash earnings + platform fee owed = what cash customers paid; online earnings exclude the fee; counts add up", async () => {
    const { shop, owner, buyer } = await seedShop();
    const now = new Date();
    const cash = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "COMPLETED",
      payment_method: "CASH",
      item_total: 150,
      delivery_fee: 20,
      platform_fee: 5,
      actual_delivery_time: now,
    });
    const online = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "COMPLETED",
      payment_method: "ONLINE",
      item_total: 75.25,
      delivery_fee: 0,
      platform_fee: 5,
      actual_delivery_time: now,
    });
    asUser(owner);
    const d = (await getEarnings()).body.data;
    expect(paise(d.cash.earnings) + paise(d.cash.platformFeeOwed)).toBe(
      paise(cash.total_price)
    );
    expect(paise(d.cash.platformFeeOwed)).toBe(500);
    expect(paise(d.online.earnings)).toBe(
      paise(online.total_price) - paise(online.platform_fee)
    );
    expect(d.cash.orderCount + d.online.orderCount).toBe(d.orderCount);
    expect(paise(d.cash.earnings) + paise(d.online.earnings)).toBe(
      paise(d.vendorEarnings)
    );
  });

  it("an order placed at checkout and delivered via OTP shows up in earnings with exactly its own totals", async () => {
    const s = await seedCheckout({
      lines: [
        { price: 33.33, discount: 10, quantity: 3 },
        { price: 80, quantity: 1 },
      ],
      shop: { direct_delivery_fee: 25 },
    });
    const order = await placeDirectOrder(s);
    asUser(s.owner);
    await acceptOrderAction(order.id);
    await startDirectDeliveryAction(order.id);
    const { delivery_otp } = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    await verifyDeliveryOtpAction(order.id, delivery_otp!);

    const d = (await getEarnings()).body.data;
    expect(d.orderCount).toBe(1);
    expect(paise(d.customersPaid)).toBe(paise(order.total_price));
    expect(paise(d.vendorEarnings)).toBe(
      paise(order.item_total) + paise(order.delivery_fee)
    );
    expect(paise(d.platformFee)).toBe(paise(order.platform_fee));
  });

  it("earnings require a signed-in shop owner", async () => {
    asAnonymous();
    expect((await getEarnings()).status).toBe(401);
    asUser(await createUser());
    const res = await getEarnings();
    expect([401, 403]).toContain(res.status);
  });
});
