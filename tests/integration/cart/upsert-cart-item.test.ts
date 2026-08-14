import { beforeEach, describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createProduct, createShop, createUser } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

const { cartService } = createContainer({ prisma: testPrisma });

describe("upsertCartItem", () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    user = await createUser();
  });

  it("throws instead of adding the item when quantity is positive (production bug — cart.service.ts:75)", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    const product = await createProduct({ shop_id: shop.id });
    void owner;

    await expect(
      cartService.upsertCartItem(user.id, product.id, 2)
    ).rejects.toThrow();

    const cart = await testPrisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user.id, shop_id: shop.id } },
      include: { items: true },
    });
    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(0);
  });

  it("removes the item when quantity is zero", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    const product = await createProduct({ shop_id: shop.id });
    void owner;

    await testPrisma.cart.create({
      data: {
        user_id: user.id,
        shop_id: shop.id,
        items: { create: [{ product_id: product.id, quantity: 3 }] },
      },
    });

    await cartService.upsertCartItem(user.id, product.id, 0);

    await expect(testPrisma.cartItem.count()).resolves.toBe(0);
  });

  it("removes the item when quantity is negative", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    const product = await createProduct({ shop_id: shop.id });
    void owner;

    await testPrisma.cart.create({
      data: {
        user_id: user.id,
        shop_id: shop.id,
        items: { create: [{ product_id: product.id, quantity: 3 }] },
      },
    });

    await cartService.upsertCartItem(user.id, product.id, -1);

    await expect(testPrisma.cartItem.count()).resolves.toBe(0);
  });

  it("is a no-op, not an error, when removing an item that was never added", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    const product = await createProduct({ shop_id: shop.id });
    void owner;

    await expect(
      cartService.upsertCartItem(user.id, product.id, 0)
    ).resolves.toBeDefined();
    await expect(testPrisma.cartItem.count()).resolves.toBe(0);
  });

  it("throws NotFoundError for a product that does not exist", async () => {
    await expect(
      cartService.upsertCartItem(user.id, "missing-product", 1)
    ).rejects.toThrow(/not found/i);
  });

  it("finds-or-creates one cart per shop, with no cross-shop guard", async () => {
    const shopA = await createShop();
    const ownerA = await createUser({ shop_id: shopA.id });
    const productA = await createProduct({ shop_id: shopA.id });
    void ownerA;

    const shopB = await createShop();
    const ownerB = await createUser({ shop_id: shopB.id });
    const productB = await createProduct({ shop_id: shopB.id });
    void ownerB;

    await cartService.upsertCartItem(user.id, productA.id, 0);
    await cartService.upsertCartItem(user.id, productB.id, 0);

    const carts = await testPrisma.cart.findMany({
      where: { user_id: user.id },
    });
    expect(carts).toHaveLength(2);
    const shopIds = carts.map((c) => c.shop_id).sort();
    expect(shopIds).toEqual([shopA.id, shopB.id].sort());
  });

  it("cascades cart and items when the user is deleted", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    const product = await createProduct({ shop_id: shop.id });
    void owner;

    await testPrisma.cart.create({
      data: {
        user_id: user.id,
        shop_id: shop.id,
        items: { create: [{ product_id: product.id, quantity: 1 }] },
      },
    });

    await expect(testPrisma.cart.count()).resolves.toBe(1);
    await expect(testPrisma.cartItem.count()).resolves.toBe(1);

    await testPrisma.user.delete({ where: { id: user.id } });

    await expect(testPrisma.cart.count()).resolves.toBe(0);
    await expect(testPrisma.cartItem.count()).resolves.toBe(0);
  });
});

describe("getCartData", () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    user = await createUser();
  });

  it("returns pricing and shop details for the authenticated owner's cart", async () => {
    const shop = await createShop({ default_delivery_fee: 10 });
    const owner = await createUser({ shop_id: shop.id });
    void owner;
    const product = await createProduct({ shop_id: shop.id, price: 100 });

    const cart = await testPrisma.cart.create({
      data: {
        user_id: user.id,
        shop_id: shop.id,
        items: { create: [{ product_id: product.id, quantity: 2 }] },
      },
    });

    asUser(user);
    const data = await cartService.getCartData(cart.id);

    expect(data.item_total).toBe(200);
    expect(data.delivery_fee).toBe(10);
    expect(data.platform_fee).toBe(5);
    expect(data.total).toBe(215);
    expect(data.shop_id).toBe(shop.id);
    expect(data.shop_accepting_orders).toBe(true);
  });

  it("throws (via next/navigation's notFound) for a cart with no items", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    void owner;
    const cart = await testPrisma.cart.create({
      data: { user_id: user.id, shop_id: shop.id },
    });

    asUser(user);
    await expect(cartService.getCartData(cart.id)).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });

  it("throws for a cart id that does not belong to the caller", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    void owner;
    const product = await createProduct({ shop_id: shop.id });

    const cartOwner = await createUser();
    const otherCart = await testPrisma.cart.create({
      data: {
        user_id: cartOwner.id,
        shop_id: shop.id,
        items: { create: [{ product_id: product.id, quantity: 1 }] },
      },
    });

    asUser(user);
    await expect(cartService.getCartData(otherCart.id)).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });

  it("requires an authenticated caller", async () => {
    asAnonymous();
    await expect(cartService.getCartData("any-cart-id")).rejects.toThrow();
  });
});
