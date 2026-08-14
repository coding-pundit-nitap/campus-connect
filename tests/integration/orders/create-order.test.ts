import { beforeEach, describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createUserAddress,
  futureSlotTime,
  seedCartReadyForCheckout,
  seedOpenBatch,
} from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

const { orderService } = createContainer({ prisma: testPrisma });

type CreateOrderArgs = {
  user_id: string;
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  pg_payment_id?: string;
  requested_delivery_time?: Date;
  upi_transaction_id?: string;
  customer_notes?: string;
  is_direct_delivery?: boolean;
  batch_id?: string;
};

function createOrder(args: CreateOrderArgs) {
  return orderService.createOrderFromCart(
    args.user_id,
    args.shop_id,
    args.payment_method,
    args.delivery_address_id,
    args.pg_payment_id,
    args.requested_delivery_time,
    args.upi_transaction_id,
    args.customer_notes,
    args.is_direct_delivery,
    args.batch_id
  );
}

describe("createOrderFromCart", () => {
  let seeded: Awaited<ReturnType<typeof seedCartReadyForCheckout>>;

  beforeEach(async () => {
    seeded = await seedCartReadyForCheckout();
  });

  it("creates an Order and matching OrderItem rows from the cart's items", async () => {
    const { user, shop, cart, address } = seeded;

    const order = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });

    expect(order.user_id).toBe(user.id);
    expect(order.shop_id).toBe(shop.id);
    expect(order.order_status).toBe("NEW");
    expect(order.payment_status).toBe("PENDING");
    expect(order.is_direct_delivery).toBe(true);

    const orderItems = await testPrisma.orderItem.findMany({
      where: { order_id: order.id },
      orderBy: { product_id: "asc" },
    });
    const cartProductIds = cart.items.map((i) => i.product_id).sort();
    expect(orderItems).toHaveLength(cart.items.length);
    expect(orderItems.map((i) => i.product_id).sort()).toEqual(
      cartProductIds
    );
    for (const item of orderItems) {
      const cartItem = cart.items.find((i) => i.product_id === item.product_id);
      expect(item.quantity).toBe(cartItem?.quantity);
      expect(item.price.toString()).toBe("100");
    }
  });

  it("reconciles total_price as item_total + delivery_fee + platform_fee, compared as Decimal", async () => {
    const { user, shop, address } = seeded;

    const created = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });

    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: created.id },
    });
    const expected = order.item_total
      .add(order.delivery_fee)
      .add(order.platform_fee);
    expect(order.total_price.toString()).toBe(expected.toString());

    expect(order.item_total.toString()).toBe("200");
    expect(order.delivery_fee.toString()).toBe("0");
    expect(order.platform_fee.toString()).toBe("5");
    expect(order.total_price.toString()).toBe("205");
  });

  it("empties the cart after creating the order", async () => {
    const { user, shop, cart, address } = seeded;

    await expect(testPrisma.cartItem.count()).resolves.toBe(
      cart.items.length
    );

    await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });

    await expect(
      testPrisma.cartItem.count({ where: { cart_id: cart.id } })
    ).resolves.toBe(0);
    await expect(
      testPrisma.cart.findUnique({ where: { id: cart.id } })
    ).resolves.not.toBeNull();
  });

  it("assigns display_id NITAP-001000 to the first order and NITAP-001001 to the second", async () => {
    const { user, shop, address } = seeded;

    const first = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });
    expect(first.display_id).toBe("NITAP-001000");

    const second = await seedCartReadyForCheckout();
    const address2 = await createUserAddress({
      user_id: second.user.id,
      building_id: "bld-test-1",
    });
    const secondOrder = await createOrder({
      user_id: second.user.id,
      shop_id: second.shop.id,
      payment_method: "CASH",
      delivery_address_id: address2.id,
      is_direct_delivery: true,
    });
    expect(secondOrder.display_id).toBe("NITAP-001001");
  });

  it("attaches the order to an existing OPEN batch when requested_delivery_time matches its cutoff", async () => {
    const { user, shop, address } = seeded;
    const { at } = futureSlotTime();
    const batch = await seedOpenBatch({ cutoffAt: at, shop_id: shop.id });

    const order = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      requested_delivery_time: batch.cutoff_time,
    });

    expect(order.batch_id).toBe(batch.id);
    expect(order.requested_delivery_time?.getTime()).toBe(
      batch.cutoff_time.getTime()
    );
    expect(order.is_direct_delivery).toBe(false);

    await expect(
      testPrisma.batch.count({ where: { shop_id: shop.id } })
    ).resolves.toBe(1);
    const reloadedBatch = await testPrisma.batch.findUniqueOrThrow({
      where: { id: batch.id },
    });
    expect(reloadedBatch.status).toBe("OPEN");
  });

  it("stores a snapshot of the delivery address on the order", async () => {
    const { user, shop, address } = seeded;

    const created = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });

    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(order.delivery_address_snapshot).toEqual({
      hostel_block: address.hostel_block,
      building: address.building,
      room_number: address.room_number,
      notes: address.notes,
    });
  });
});
