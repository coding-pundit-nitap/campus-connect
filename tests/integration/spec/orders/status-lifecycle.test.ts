// Rule-based order status lifecycle tests (O21-O35).
import { describe, expect, it } from "vitest";

import { updateOrderStatusAdminAction } from "../../../../src/actions/admin/order-actions";
import {
  cancelOrderAction,
  updateOrderStatusAction,
} from "../../../../src/actions/orders/order-actions";
import { reorderAction } from "../../../../src/actions/orders/reorder-action";
import {
  acceptOrderAction,
  markDeliveryFailedAction,
  rejectOrderAction,
  startDirectDeliveryAction,
  verifyDeliveryOtpAction,
} from "../../../../src/actions/shop/order-management-actions";
import { startIndividualDeliveryAction } from "../../../../src/actions/vendor/individual-delivery-actions";
import type { OrderStatus } from "../../../../src/generated/client";
import { createProduct, createShop, createUser } from "../../../factories";
import {
  createOrderRow,
  placeDirectOrder,
  seedCheckout,
} from "../../../helpers/spec-orders";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

const STATUSES: OrderStatus[] = [
  "NEW",
  "BATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERY_FAILED",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
];

// What the vendor UI offers at each status (order-status-updater.tsx options,
// intake/prep/dispatch card buttons). Terminal states show "Final State".
const VENDOR_UI_NEXT: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["BATCHED", "CANCELLED"],
  BATCHED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "DELIVERY_FAILED", "CANCELLED"],
  DELIVERY_FAILED: ["CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  RESCHEDULED: ["OUT_FOR_DELIVERY", "CANCELLED"],
};

async function seedShop() {
  const shop = await createShop();
  const owner = await createUser({ shop_id: shop.id });
  const buyer = await createUser();
  return { shop, owner, buyer };
}

const reload = (id: string) =>
  testPrisma.order.findUniqueOrThrow({ where: { id } });

describe("orders spec: status lifecycle", () => {
  describe("RULE O21: shop-owner status changes follow the transition table", () => {
    const pairs = STATUSES.flatMap((from) =>
      STATUSES.filter((to) => to !== from).map((to) => [from, to] as const)
    );
    it.each(pairs)("RULE O21: %s -> %s", async (from, to) => {
      const { shop, owner, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: from,
      });
      asUser(owner);
      const allowed = VENDOR_UI_NEXT[from].includes(to);
      const call = updateOrderStatusAction({ order_id: order.id, status: to });
      if (allowed) {
        await expect(call).resolves.toMatchObject({ success: true });
        expect((await reload(order.id)).order_status).toBe(to);
      } else {
        await expect(call).rejects.toMatchObject({ name: "ValidationError" });
        expect((await reload(order.id)).order_status).toBe(from);
      }
    });
  });

  it("RULE O22: another shop's owner and a plain user cannot change an order's status", async () => {
    const { shop, buyer } = await seedShop();
    const other = await seedShop();
    const order = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "NEW",
    });
    asUser(other.owner);
    await expect(
      updateOrderStatusAction({ order_id: order.id, status: "BATCHED" })
    ).rejects.toMatchObject({ name: "UnauthorizedError" });
    asUser(buyer);
    await expect(
      updateOrderStatusAction({ order_id: order.id, status: "CANCELLED" })
    ).rejects.toBeTruthy();
    asUser(other.owner);
    await expect(rejectOrderAction(order.id)).rejects.toBeTruthy();
    expect((await reload(order.id)).order_status).toBe("NEW");
  });

  it("RULE O23: Accept moves NEW -> BATCHED; it is not offered for any other status", async () => {
    const { shop, owner, buyer } = await seedShop();
    const fresh = await createOrderRow({ shop_id: shop.id, user_id: buyer.id });
    const old = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "OUT_FOR_DELIVERY",
    });
    asUser(owner);
    await acceptOrderAction(fresh.id);
    expect((await reload(fresh.id)).order_status).toBe("BATCHED");
    await expect(acceptOrderAction(old.id)).rejects.toBeTruthy();
    expect((await reload(old.id)).order_status).toBe("OUT_FOR_DELIVERY");
  });

  it("RULE O24: Reject cancels a NEW or DELIVERY_FAILED order but not a COMPLETED one", async () => {
    const { shop, owner, buyer } = await seedShop();
    const a = await createOrderRow({ shop_id: shop.id, user_id: buyer.id });
    const b = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "DELIVERY_FAILED",
    });
    const c = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "COMPLETED",
      payment_status: "COMPLETED",
    });
    asUser(owner);
    await rejectOrderAction(a.id, "Out of stock");
    await rejectOrderAction(b.id);
    await expect(rejectOrderAction(c.id)).rejects.toBeTruthy();
    expect((await reload(a.id)).order_status).toBe("CANCELLED");
    expect((await reload(a.id)).cancellation_reason).toBe("Out of stock");
    expect((await reload(b.id)).order_status).toBe("CANCELLED");
    expect((await reload(c.id)).order_status).toBe("COMPLETED");
    expect((await reload(c.id)).payment_status).toBe("COMPLETED");
  });

  it("RULE O25: Start Direct Delivery moves an accepted (BATCHED) direct order to OUT_FOR_DELIVERY with a 4-digit OTP; a NEW order cannot start", async () => {
    const { shop, owner, buyer } = await seedShop();
    const accepted = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "BATCHED",
      is_direct_delivery: true,
    });
    const fresh = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      is_direct_delivery: true,
    });
    asUser(owner);
    await startDirectDeliveryAction(accepted.id);
    const after = await reload(accepted.id);
    expect(after.order_status).toBe("OUT_FOR_DELIVERY");
    expect(after.delivery_otp).toMatch(/^\d{4}$/);
    await expect(startDirectDeliveryAction(fresh.id)).rejects.toBeTruthy();
    expect((await reload(fresh.id)).order_status).toBe("NEW");
  });

  describe("RULE O26: individual delivery (owner order page) can only start from a status that may go OUT_FOR_DELIVERY", () => {
    it.each(["NEW", "DELIVERY_FAILED", "COMPLETED", "CANCELLED"] as const)(
      "RULE O26: starting individual delivery from %s is rejected",
      async (from) => {
        const { shop, owner, buyer } = await seedShop();
        const order = await createOrderRow({
          shop_id: shop.id,
          user_id: buyer.id,
          order_status: from,
        });
        asUser(owner);
        await expect(
          startIndividualDeliveryAction(order.id)
        ).rejects.toMatchObject({ name: "ValidationError" });
        const after = await reload(order.id);
        expect(after.order_status).toBe(from);
        expect(after.delivery_otp).toBeNull();
      }
    );

    it("RULE O26: starting individual delivery from BATCHED sets OUT_FOR_DELIVERY and a 4-digit OTP", async () => {
      const { shop, owner, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "BATCHED",
      });
      asUser(owner);
      await startIndividualDeliveryAction(order.id);
      const after = await reload(order.id);
      expect(after.order_status).toBe("OUT_FOR_DELIVERY");
      expect(after.delivery_otp).toMatch(/^\d{4}$/);
    });

    it.todo(
      "RULE O26b: individual delivery is only for direct-delivery orders - the owner order page offers 'Start Direct Delivery' for any BATCHED order while the console only offers it for direct orders; needs product decision"
    );
  });

  it("RULE O27: a wrong OTP leaves the order OUT_FOR_DELIVERY; the right OTP completes it, records the delivery time, and marks a CASH payment COMPLETED", async () => {
    const { shop, owner, buyer } = await seedShop();
    const order = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "OUT_FOR_DELIVERY",
      delivery_otp: "4321",
      payment_method: "CASH",
    });
    asUser(owner);
    await expect(
      verifyDeliveryOtpAction(order.id, "1234")
    ).rejects.toBeTruthy();
    expect((await reload(order.id)).order_status).toBe("OUT_FOR_DELIVERY");

    await verifyDeliveryOtpAction(order.id, "4321");
    const after = await reload(order.id);
    expect(after.order_status).toBe("COMPLETED");
    expect(after.payment_status).toBe("COMPLETED");
    expect(after.actual_delivery_time).not.toBeNull();
  });

  it("RULE O27: completing an ONLINE (already paid) order keeps payment COMPLETED", async () => {
    const { shop, owner, buyer } = await seedShop();
    const order = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "OUT_FOR_DELIVERY",
      delivery_otp: "1111",
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
    });
    asUser(owner);
    await verifyDeliveryOtpAction(order.id, "1111");
    expect((await reload(order.id)).payment_status).toBe("COMPLETED");
  });

  it("RULE O28: Mark failed moves OUT_FOR_DELIVERY -> DELIVERY_FAILED and is not available earlier", async () => {
    const { shop, owner, buyer } = await seedShop();
    const out = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "OUT_FOR_DELIVERY",
    });
    const accepted = await createOrderRow({
      shop_id: shop.id,
      user_id: buyer.id,
      order_status: "BATCHED",
    });
    asUser(owner);
    await markDeliveryFailedAction(out.id, "No one home");
    expect((await reload(out.id)).order_status).toBe("DELIVERY_FAILED");
    await expect(
      markDeliveryFailedAction(accepted.id, "x")
    ).rejects.toBeTruthy();
    expect((await reload(accepted.id)).order_status).toBe("BATCHED");
  });

  describe("RULE O29: who may cancel - the customer only while NEW and unpaid", () => {
    it("RULE O29: the customer cancels their own NEW cash order; the order is CANCELLED and the unpaid payment is CANCELLED, not left PENDING", async () => {
      const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
      const order = await placeDirectOrder(s);
      asUser(s.buyer);
      await cancelOrderAction(order.id);
      const after = await reload(order.id);
      expect(after.order_status).toBe("CANCELLED");
      expect(after.payment_status).toBe("CANCELLED");
    });

    it("RULE O29: the customer cannot cancel once the shop accepted (BATCHED)", async () => {
      const { shop, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "BATCHED",
      });
      asUser(buyer);
      await expect(cancelOrderAction(order.id)).rejects.toMatchObject({
        name: "ValidationError",
      });
      expect((await reload(order.id)).order_status).toBe("BATCHED");
    });

    it("RULE O29: the customer cannot cancel a paid order (UI hides Cancel when payment is COMPLETED)", async () => {
      const { shop, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        payment_method: "ONLINE",
        payment_status: "COMPLETED",
      });
      asUser(buyer);
      await expect(cancelOrderAction(order.id)).rejects.toMatchObject({
        name: "ValidationError",
      });
      expect((await reload(order.id)).order_status).toBe("NEW");
    });

    it("RULE O29: a user cannot cancel someone else's order", async () => {
      const { shop, buyer } = await seedShop();
      const stranger = await createUser();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
      });
      asUser(stranger);
      await expect(cancelOrderAction(order.id)).rejects.toMatchObject({
        name: "UnauthorizedError",
      });
      expect((await reload(order.id)).order_status).toBe("NEW");
    });
  });

  describe("RULE O30: payment status follows the order on cancellation", () => {
    it("RULE O30: the shop cancelling a paid ONLINE order refunds it", async () => {
      const { shop, owner, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "BATCHED",
        payment_method: "ONLINE",
        payment_status: "COMPLETED",
      });
      asUser(owner);
      await updateOrderStatusAction({
        order_id: order.id,
        status: "CANCELLED",
      });
      expect((await reload(order.id)).payment_status).toBe("REFUNDED");
    });

    it("RULE O30: the shop rejecting an unpaid CASH order marks its payment CANCELLED", async () => {
      const { shop, owner, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
      });
      asUser(owner);
      await rejectOrderAction(order.id);
      expect((await reload(order.id)).payment_status).toBe("CANCELLED");
    });

    it("RULE O30: the shop rejecting a CASH order whose payment was collected refunds it", async () => {
      const { shop, owner, buyer } = await seedShop();
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "DELIVERY_FAILED",
        payment_method: "CASH",
        payment_status: "COMPLETED",
      });
      asUser(owner);
      await rejectOrderAction(order.id);
      const after = await reload(order.id);
      expect(after.order_status).toBe("CANCELLED");
      expect(after.payment_status).toBe("REFUNDED");
    });

    it("RULE O30: an admin re-saving the same status leaves the payment alone", async () => {
      const { shop, buyer } = await seedShop();
      const admin = await createUser({ role: "ADMIN" });
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "COMPLETED",
        payment_method: "CASH",
        payment_status: "PENDING",
      });
      asUser(admin);
      await updateOrderStatusAdminAction({
        order_id: order.id,
        order_status: "COMPLETED",
      });
      expect((await reload(order.id)).payment_status).toBe("PENDING");
    });

    it("RULE O30: an admin cancelling a paid ONLINE order refunds it", async () => {
      const { shop, buyer } = await seedShop();
      const admin = await createUser({ role: "ADMIN" });
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "OUT_FOR_DELIVERY",
        payment_method: "ONLINE",
        payment_status: "COMPLETED",
      });
      asUser(admin);
      await updateOrderStatusAdminAction({
        order_id: order.id,
        order_status: "CANCELLED",
      });
      const after = await reload(order.id);
      expect(after.order_status).toBe("CANCELLED");
      expect(after.payment_status).toBe("REFUNDED");
    });

    it("RULE O30: an admin completing a CASH order marks the cash payment COMPLETED", async () => {
      const { shop, buyer } = await seedShop();
      const admin = await createUser({ role: "ADMIN" });
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "OUT_FOR_DELIVERY",
        payment_method: "CASH",
      });
      asUser(admin);
      await updateOrderStatusAdminAction({
        order_id: order.id,
        order_status: "COMPLETED",
      });
      const after = await reload(order.id);
      expect(after.payment_status).toBe("COMPLETED");
      expect(after.actual_delivery_time).not.toBeNull();
    });

    it.todo(
      "RULE O30b: cancelling an ONLINE order whose payment is still PENDING (never confirmed) should mark it CANCELLED, not REFUNDED - code currently marks every cancelled ONLINE order REFUNDED; needs product decision"
    );
  });

  it("RULE O31: only an admin can use the admin status override", async () => {
    const { shop, owner, buyer } = await seedShop();
    const order = await createOrderRow({ shop_id: shop.id, user_id: buyer.id });
    asUser(owner);
    await expect(
      updateOrderStatusAdminAction({
        order_id: order.id,
        order_status: "COMPLETED",
      })
    ).rejects.toMatchObject({ name: "ForbiddenError" });
    expect((await reload(order.id)).order_status).toBe("NEW");
  });

  it.todo(
    "RULE O31b: an admin order-status override is written to the admin audit log (AdminAction.ORDER_STATUS_OVERRIDE) - code currently writes no audit row; needs product decision"
  );

  it.todo(
    "RULE O32: cancelling an order returns its quantities to stock - code currently never restores stock on cancel/reject; needs product decision"
  );

  describe("RULE O33: reorder", () => {
    async function pastOrder() {
      const { shop, buyer } = await seedShop();
      const inStock = await createProduct({
        shop_id: shop.id,
        stock_quantity: 10,
      });
      const scarce = await createProduct({
        shop_id: shop.id,
        stock_quantity: 2,
      });
      const gone = await createProduct({ shop_id: shop.id, stock_quantity: 0 });
      const deleted = await createProduct({
        shop_id: shop.id,
        stock_quantity: 10,
        deleted_at: new Date(),
      });
      const order = await createOrderRow({
        shop_id: shop.id,
        user_id: buyer.id,
        order_status: "COMPLETED",
      });
      await testPrisma.orderItem.createMany({
        data: [
          {
            order_id: order.id,
            product_id: inStock.id,
            quantity: 3,
            price: 100,
          },
          {
            order_id: order.id,
            product_id: scarce.id,
            quantity: 5,
            price: 100,
          },
          { order_id: order.id, product_id: gone.id, quantity: 1, price: 100 },
          {
            order_id: order.id,
            product_id: deleted.id,
            quantity: 1,
            price: 100,
          },
        ],
      });
      return { shop, buyer, order, inStock, scarce, gone, deleted };
    }

    it("RULE O33: reorder refills the cart with available items, capped at stock, skipping out-of-stock and deleted products", async () => {
      const p = await pastOrder();
      asUser(p.buyer);
      const res = await reorderAction(p.order.id);
      expect(res.success).toBe(true);
      const items = await testPrisma.cartItem.findMany({
        where: { cart: { user_id: p.buyer.id, shop_id: p.shop.id } },
      });
      const q = Object.fromEntries(
        items.map((i) => [i.product_id, i.quantity])
      );
      expect(q).toEqual({ [p.inStock.id]: 3, [p.scarce.id]: 2 });
    });

    it("RULE O33: a user cannot reorder someone else's order", async () => {
      const p = await pastOrder();
      const stranger = await createUser();
      asUser(stranger);
      await expect(reorderAction(p.order.id)).rejects.toBeTruthy();
      expect(
        await testPrisma.cartItem.count({
          where: { cart: { user_id: stranger.id } },
        })
      ).toBe(0);
    });

    it.todo(
      "RULE O33b: reorder into a cart that already holds the product never makes the line exceed stock - code currently increments the existing line by min(ordered, stock), so 2 in cart + reorder of 5 with stock 2 gives 4; needs product decision"
    );
  });
});
