// Rule-based checkout guard tests (O10-O20).
import { describe, expect, it } from "vitest";

import { upsertCartItem } from "../../../../src/actions/cart/cart-actions";
import { createOrderAction } from "../../../../src/actions/orders/order-actions";
import { createProduct, createShop, futureSlotTime } from "../../../factories";
import { placeDirectOrder, seedCheckout } from "../../../helpers/spec-orders";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

async function expectNothingChanged(
  s: Awaited<ReturnType<typeof seedCheckout>>
) {
  expect(await testPrisma.order.count()).toBe(0);
  expect(await testPrisma.orderItem.count()).toBe(0);
  const items = await testPrisma.cartItem.count({
    where: { cart_id: s.cart.id },
  });
  expect(items).toBe(s.products.length);
}

describe("orders spec: checkout guards", () => {
  it("RULE O10: an item_total below the shop's per-user minimum order value is rejected; nothing is written", async () => {
    const s = await seedCheckout({
      lines: [{ price: 299.99, quantity: 1, stock: 5 }],
      shop: { min_order_value: 300, direct_delivery_fee: 50 },
    });
    // fees do not count towards the minimum (cart-footer compares the subtotal)
    await expect(placeDirectOrder(s)).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringMatching(/minimum order value/i),
    });
    await expectNothingChanged(s);
    const p = await testPrisma.product.findUniqueOrThrow({
      where: { id: s.products[0].id },
    });
    expect(p.stock_quantity).toBe(5);
  });

  it("RULE O10: an item_total exactly equal to the minimum order value is accepted", async () => {
    const s = await seedCheckout({
      lines: [{ price: 150, quantity: 2 }],
      shop: { min_order_value: 300 },
    });
    const order = await placeDirectOrder(s);
    expect(Number(order.item_total)).toBe(300);
  });

  it("RULE O10: the minimum is checked against the discounted item_total", async () => {
    const s = await seedCheckout({
      lines: [{ price: 400, discount: 50, quantity: 1 }],
      shop: { min_order_value: 300 },
    });
    await expect(placeDirectOrder(s)).rejects.toMatchObject({
      name: "ValidationError",
    });
  });

  it("RULE O11: the collective batch threshold never blocks an individual checkout", async () => {
    const s = await seedCheckout({
      lines: [{ price: 100, quantity: 1 }],
      shop: { batch_min_order_value: 100000 },
    });
    await expect(placeDirectOrder(s)).resolves.toBeTruthy();
  });

  it("RULE O12: ordering more than the stock is rejected and stock is untouched", async () => {
    const s = await seedCheckout({
      lines: [{ price: 100, quantity: 3, stock: 2 }],
    });
    await expect(placeDirectOrder(s)).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringMatching(/insufficient stock/i),
    });
    await expectNothingChanged(s);
    const p = await testPrisma.product.findUniqueOrThrow({
      where: { id: s.products[0].id },
    });
    expect(p.stock_quantity).toBe(2);
  });

  it("RULE O12: ordering exactly the remaining stock succeeds and stock is decremented by the quantity", async () => {
    const s = await seedCheckout({
      lines: [
        { price: 100, quantity: 2, stock: 2 },
        { price: 10, quantity: 3, stock: 10 },
      ],
    });
    await placeDirectOrder(s);
    const [a, b] = await Promise.all(
      s.products.map((p) =>
        testPrisma.product.findUniqueOrThrow({ where: { id: p.id } })
      )
    );
    expect(a.stock_quantity).toBe(0);
    expect(b.stock_quantity).toBe(7);
  });

  it("RULE O13: a soft-deleted product in the cart is rejected", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    await testPrisma.product.update({
      where: { id: s.products[0].id },
      data: { deleted_at: new Date() },
    });
    await expect(placeDirectOrder(s)).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringMatching(/no longer available/i),
    });
    await expectNothingChanged(s);
  });

  it("RULE O13: an out-of-stock product in the cart is rejected", async () => {
    const s = await seedCheckout({
      lines: [{ price: 100, quantity: 1, stock: 0 }],
    });
    await expect(placeDirectOrder(s)).rejects.toMatchObject({
      name: "ValidationError",
    });
    await expectNothingChanged(s);
  });

  it.each([
    ["inactive", { is_active: false }],
    ["soft-deleted", { deleted_at: new Date() }],
    ["not accepting orders", { accepting_orders: false }],
  ])(
    "RULE O13: checkout at a %s shop is rejected (createOrderAction)",
    async (_label, shopState) => {
      const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
      await testPrisma.shop.update({
        where: { id: s.shop.id },
        data: shopState,
      });
      asUser(s.buyer);
      const res = await createOrderAction({
        shop_id: s.shop.id,
        payment_method: "CASH",
        delivery_address_id: s.address.id,
        is_direct_delivery: true,
      });
      expect(res.success).toBe(false);
      await expectNothingChanged(s);
    }
  );

  it("RULE O14: an empty cart is rejected", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    await testPrisma.cartItem.deleteMany({ where: { cart_id: s.cart.id } });
    await expect(placeDirectOrder(s)).rejects.toMatchObject({
      message: expect.stringMatching(/cart is empty/i),
    });
    expect(await testPrisma.order.count()).toBe(0);
  });

  it("RULE O15: after a successful order the cart for that shop is empty, and carts at other shops are untouched", async () => {
    const s = await seedCheckout({
      lines: [
        { price: 100, quantity: 1 },
        { price: 50, quantity: 2 },
      ],
    });
    const otherShop = await createShop();
    const otherProduct = await createProduct({ shop_id: otherShop.id });
    const otherCart = await testPrisma.cart.create({
      data: {
        user_id: s.buyer.id,
        shop_id: otherShop.id,
        items: { create: [{ product_id: otherProduct.id, quantity: 4 }] },
      },
    });

    await placeDirectOrder(s);

    expect(
      await testPrisma.cartItem.count({ where: { cart_id: s.cart.id } })
    ).toBe(0);
    expect(
      await testPrisma.cartItem.count({ where: { cart_id: otherCart.id } })
    ).toBe(1);
  });

  it("RULE O16: cart quantity must be a whole number >= 0; a fractional or negative quantity is rejected as a ValidationError and the cart is unchanged", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 2 }] });
    asUser(s.buyer);
    for (const quantity of [2.5, -1]) {
      await expect(
        upsertCartItem({ product_id: s.products[0].id, quantity })
      ).rejects.toMatchObject({ name: "ValidationError" });
    }
    const item = await testPrisma.cartItem.findFirstOrThrow({
      where: { cart_id: s.cart.id },
    });
    expect(item.quantity).toBe(2);
  });

  it("RULE O16: setting a cart quantity replaces it (not increments), and quantity 0 removes the line", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 2 }] });
    asUser(s.buyer);
    await upsertCartItem({ product_id: s.products[0].id, quantity: 5 });
    const item = await testPrisma.cartItem.findFirstOrThrow({
      where: { cart_id: s.cart.id },
    });
    expect(item.quantity).toBe(5);

    await upsertCartItem({ product_id: s.products[0].id, quantity: 0 });
    expect(
      await testPrisma.cartItem.count({ where: { cart_id: s.cart.id } })
    ).toBe(0);
  });

  it.todo(
    "RULE O17: a cart line cannot exceed the product's stock - code currently accepts any quantity in upsertCartItem (checkout still rejects it); needs product decision"
  );

  it.todo(
    "RULE O17b: a soft-deleted product cannot be added to a cart - code currently adds it (checkout still rejects it); needs product decision"
  );

  it("RULE O18: an ONLINE order without a valid UPI transaction id (10-35 alphanumerics) is rejected", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    asUser(s.buyer);
    for (const upi_transaction_id of [
      undefined,
      "",
      "abc",
      "bad id with spaces!",
    ]) {
      const res = await createOrderAction({
        shop_id: s.shop.id,
        payment_method: "ONLINE",
        delivery_address_id: s.address.id,
        is_direct_delivery: true,
        upi_transaction_id,
      });
      expect(res.success, String(upi_transaction_id)).toBe(false);
    }
    await expectNothingChanged(s);
  });

  it("RULE O18: an ONLINE order with a valid UPI transaction id is accepted", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    asUser(s.buyer);
    const res = await createOrderAction({
      shop_id: s.shop.id,
      payment_method: "ONLINE",
      delivery_address_id: s.address.id,
      is_direct_delivery: true,
      upi_transaction_id: "ABC1234567890",
    });
    expect(res.success, JSON.stringify(res)).toBe(true);
  });

  it("RULE O19: a requested delivery time less than 15 minutes ahead is rejected", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    asUser(s.buyer);
    const { at } = futureSlotTime(5);
    const res = await createOrderAction({
      shop_id: s.shop.id,
      payment_method: "CASH",
      delivery_address_id: s.address.id,
      is_direct_delivery: false,
      requested_delivery_time: at,
    });
    expect(res.success).toBe(false);
    await expectNothingChanged(s);
  });

  it("RULE O20: a user cannot check out with another user's address", async () => {
    const s = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    const other = await seedCheckout({ lines: [{ price: 100, quantity: 1 }] });
    await expect(
      placeDirectOrder({ ...s, address: other.address })
    ).rejects.toMatchObject({ name: "UnauthorizedError" });
    await expectNothingChanged(s);
  });
});
