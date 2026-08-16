import { beforeEach, describe, expect, it } from "vitest";

import { updateOrderStatusAction } from "../../../src/actions/orders/order-actions";
import { VALID_ORDER_TRANSITIONS } from "../../../src/config/constants";
import type { OrderStatus } from "../../../src/generated/client";
import {
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
} from "../../../src/lib/custom-error";
import {
  createOrderAtStatus,
  createUser,
  seedCartReadyForCheckout,
  seedShopWithProducts,
} from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

const allStatuses = Object.keys(
  VALID_ORDER_TRANSITIONS
) as (keyof typeof VALID_ORDER_TRANSITIONS)[];

const validPairs = allStatuses.flatMap((from) =>
  VALID_ORDER_TRANSITIONS[from].map((to) => [from, to] as const)
);

const invalidPairs = allStatuses.flatMap((from) =>
  allStatuses
    .filter(
      (to) => !(VALID_ORDER_TRANSITIONS[from] as readonly string[]).includes(to)
    )
    .map((to) => [from, to] as const)
);

describe("updateOrderStatusAction — VALID_ORDER_TRANSITIONS enforcement", () => {
  let shop: Awaited<ReturnType<typeof seedShopWithProducts>>["shop"];
  let owner: Awaited<ReturnType<typeof seedShopWithProducts>>["owner"];

  beforeEach(async () => {
    const seeded = await seedShopWithProducts();
    shop = seeded.shop;
    owner = seeded.owner;
  });

  describe.each(validPairs)("allows %s -> %s", (from, to) => {
    it(`transitions a real order from ${from} to ${to}`, async () => {
      const order = await createOrderAtStatus({
        shop_id: shop.id,
        order_status: from as OrderStatus,
      });
      asUser(owner);

      await updateOrderStatusAction({
        order_id: order.id,
        status: to as OrderStatus,
      });

      const reloaded = await testPrisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(reloaded.order_status).toBe(to);
    });
  });

  describe.each(invalidPairs)("rejects %s -> %s", (from, to) => {
    it(`refuses to move a real order from ${from} to ${to}, leaving it unchanged`, async () => {
      const order = await createOrderAtStatus({
        shop_id: shop.id,
        order_status: from as OrderStatus,
      });
      asUser(owner);

      const rejection = updateOrderStatusAction({
        order_id: order.id,
        status: to as OrderStatus,
      });
      await expect(rejection).rejects.toBeInstanceOf(ValidationError);
      await expect(rejection).rejects.toMatchObject({
        message: `Invalid status transition from ${from} to ${to}`,
      });

      const reloaded = await testPrisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(reloaded.order_status).toBe(from);
    });
  });
});

describe("updateOrderStatusAction — side effects of a valid transition", () => {
  let shop: Awaited<ReturnType<typeof seedShopWithProducts>>["shop"];
  let owner: Awaited<ReturnType<typeof seedShopWithProducts>>["owner"];

  beforeEach(async () => {
    const seeded = await seedShopWithProducts();
    shop = seeded.shop;
    owner = seeded.owner;
  });

  it("marks a CASH order COMPLETED and stamps actual_delivery_time on OUT_FOR_DELIVERY -> COMPLETED", async () => {
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "OUT_FOR_DELIVERY",
      payment_method: "CASH",
    });
    asUser(owner);

    await updateOrderStatusAction({ order_id: order.id, status: "COMPLETED" });

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.order_status).toBe("COMPLETED");
    expect(reloaded.payment_status).toBe("COMPLETED");
    expect(reloaded.actual_delivery_time).not.toBeNull();
  });

  it("leaves payment_status untouched for an ONLINE order transitioned to COMPLETED", async () => {
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "OUT_FOR_DELIVERY",
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
    });
    asUser(owner);

    await updateOrderStatusAction({ order_id: order.id, status: "COMPLETED" });

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.payment_status).toBe("COMPLETED");
  });

  it("refunds an ONLINE order's payment_status on cancellation", async () => {
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      payment_method: "ONLINE",
      payment_status: "COMPLETED",
    });
    asUser(owner);

    await updateOrderStatusAction({ order_id: order.id, status: "CANCELLED" });

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.order_status).toBe("CANCELLED");
    expect(reloaded.payment_status).toBe("REFUNDED");
  });

  it("marks a CASH order's payment_status CANCELLED on cancellation", async () => {
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      payment_method: "CASH",
    });
    asUser(owner);

    await updateOrderStatusAction({ order_id: order.id, status: "CANCELLED" });

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.payment_status).toBe("CANCELLED");
  });
});

describe("updateOrderStatusAction — ownership and identity guards", () => {
  it("refuses to transition an order belonging to a different shop, leaving it unchanged", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts();

    const order = await createOrderAtStatus({
      shop_id: seededA.shop.id,
      order_status: "NEW",
    });

    asUser(seededB.owner);

    await expect(
      updateOrderStatusAction({ order_id: order.id, status: "BATCHED" })
    ).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Unauthorized: Order does not belong to your shop.",
    });

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.order_status).toBe("NEW");
  });

  it("refuses an anonymous caller, leaving the order unchanged", async () => {
    const { shop } = await seedShopWithProducts();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
    });

    asAnonymous();

    // getOwnedShopId() -> getUserData() throws UnauthenticatedError when
    // there is no session at all, distinct from UnauthorizedError below
    // (a real session with no owned shop).
    await expect(
      updateOrderStatusAction({ order_id: order.id, status: "BATCHED" })
    ).rejects.toBeInstanceOf(UnauthenticatedError);

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.order_status).toBe("NEW");
  });

  it("refuses a buyer (no owned shop) attempting a transition, leaving the order unchanged", async () => {
    const { shop } = await seedShopWithProducts();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
    });
    const buyer = await createUser();
    asUser(buyer);

    await expect(
      updateOrderStatusAction({ order_id: order.id, status: "BATCHED" })
    ).rejects.toBeInstanceOf(UnauthorizedError);

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.order_status).toBe("NEW");
  });
});

describe("Order/OrderItem/Shop delete semantics (prisma/schema.prisma)", () => {
  it("keeps the order and nulls user_id when the user is deleted (Order.user: onDelete SetNull)", async () => {
    const { user: buyer, shop, cart, address, products } =
      await seedCartReadyForCheckout();
    const order = await testPrisma.order.create({
      data: {
        display_id: "TEST-SETNULL-1",
        shop_id: shop.id,
        user_id: buyer.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        delivery_address_snapshot: {},
        items: {
          create: [{ product_id: products[0].id, quantity: 1, price: 100 }],
        },
      },
    });

    await testPrisma.user.delete({ where: { id: buyer.id } });

    const reloaded = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(reloaded.user_id).toBeNull();
    await expect(
      testPrisma.orderItem.count({ where: { order_id: order.id } })
    ).resolves.toBe(1);
    await expect(
      testPrisma.cart.findUnique({ where: { id: cart.id } })
    ).resolves.toBeNull();
    await expect(
      testPrisma.userAddress.findUnique({ where: { id: address.id } })
    ).resolves.toBeNull();
  });

  it("refuses to delete a product that has an order item (OrderItem.product: onDelete Restrict)", async () => {
    const { shop, products } = await seedShopWithProducts();
    const buyer = await createUser();
    await testPrisma.order.create({
      data: {
        display_id: "TEST-RESTRICT-1",
        shop_id: shop.id,
        user_id: buyer.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        delivery_address_snapshot: {},
        items: {
          create: [{ product_id: products[0].id, quantity: 1, price: 100 }],
        },
      },
    });

    await expect(
      testPrisma.product.delete({ where: { id: products[0].id } })
    ).rejects.toThrow();

    await expect(
      testPrisma.product.findUnique({ where: { id: products[0].id } })
    ).resolves.not.toBeNull();
  });

  it("removes OrderItem rows when their order is deleted (OrderItem.order: onDelete Cascade)", async () => {
    const { shop, products } = await seedShopWithProducts();
    const buyer = await createUser();
    const order = await testPrisma.order.create({
      data: {
        display_id: "TEST-CASCADE-1",
        shop_id: shop.id,
        user_id: buyer.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        delivery_address_snapshot: {},
        items: {
          create: products.map((p) => ({
            product_id: p.id,
            quantity: 1,
            price: 100,
          })),
        },
      },
    });
    await expect(
      testPrisma.orderItem.count({ where: { order_id: order.id } })
    ).resolves.toBe(products.length);

    await testPrisma.order.delete({ where: { id: order.id } });

    await expect(
      testPrisma.orderItem.count({ where: { order_id: order.id } })
    ).resolves.toBe(0);
  });

  it("refuses to delete a shop while a user still owns it (User.owned_shop: onDelete Restrict)", async () => {
    const { shop } = await seedShopWithProducts();

    await expect(
      testPrisma.shop.delete({ where: { id: shop.id } })
    ).rejects.toThrow();

    await expect(
      testPrisma.shop.findUnique({ where: { id: shop.id } })
    ).resolves.not.toBeNull();
  });
});
