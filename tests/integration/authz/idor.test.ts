import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { cancelOrderAction } from "../../../src/actions/orders/order-actions";
import { updateProductAction } from "../../../src/actions/product/product-actions";
import {
  acceptOrderAction,
  rejectOrderAction,
} from "../../../src/actions/shop/order-management-actions";
import { GET as GET_CART } from "../../../src/app/api/cart/route";
import { GET as GET_ORDER } from "../../../src/app/api/orders/[order_id]/route";
import { GET as GET_SELLER_ORDERS } from "../../../src/app/api/seller/orders/route";
import {
  createOrderAtStatus,
  createProduct,
  createShop,
  createUser,
  seedShopWithProducts,
} from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

function getOrder(order_id: string) {
  return GET_ORDER(new NextRequest(`http://localhost/api/orders/${order_id}`), {
    params: Promise.resolve({ order_id }),
  });
}

describe("IDOR: order detail by id (GET /api/orders/[order_id])", () => {
  it("does not return another user's order — status is a denial AND the body carries none of the victim's data", async () => {
    const bob = await createUser();
    const shop = await createShop();
    const bobsOrder = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: bob.id,
    });

    const alice = await createUser();
    asUser(alice);

    const res = await getOrder(bobsOrder.id);

    expect([403, 404]).toContain(res.status);
    const body = await res.text();
    expect(body).not.toContain(bobsOrder.display_id);
    expect(body).not.toContain(bobsOrder.id);
  });
});

describe("IDOR: cancelling another user's order", () => {
  it("rejects a stranger's cancel attempt and leaves the order row unchanged", async () => {
    const bob = await createUser();
    const shop = await createShop();
    const bobsOrder = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: bob.id,
    });

    const alice = await createUser();
    asUser(alice);

    const rejection = cancelOrderAction(bobsOrder.id);
    await expect(rejection).rejects.toMatchObject({ name: "UnauthorizedError" });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(
        bobsOrder.display_id
      );
    });

    const after = await testPrisma.order.findUniqueOrThrow({
      where: { id: bobsOrder.id },
    });
    expect(after.order_status).toBe("NEW");
  });
});

describe("IDOR: vendor/shop boundaries — GET /api/seller/orders", () => {
  it("a vendor never sees another shop's orders", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts();

    const ownOrder = await createOrderAtStatus({
      shop_id: seededA.shop.id,
      order_status: "NEW",
    });
    const foreignOrder = await createOrderAtStatus({
      shop_id: seededB.shop.id,
      order_status: "NEW",
    });

    asUser(seededA.owner);
    const res = await GET_SELLER_ORDERS();
    expect(res.status).toBe(200);

    const body = await res.json();
    const ids = body.data.map((o: { id: string }) => o.id);
    expect(ids).toContain(ownOrder.id);
    expect(ids).not.toContain(foreignOrder.id);

    const bodyText = JSON.stringify(body);
    expect(bodyText).not.toContain(foreignOrder.display_id);
  });
});

describe("IDOR: vendor mutations on another shop's order", () => {
  it("acceptOrderAction refuses to accept another shop's order", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts();

    const foreignOrder = await createOrderAtStatus({
      shop_id: seededB.shop.id,
      order_status: "NEW",
    });

    asUser(seededA.owner);
    await expect(acceptOrderAction(foreignOrder.id)).rejects.toMatchObject({
      name: "BadRequestError",
    });

    const after = await testPrisma.order.findUniqueOrThrow({
      where: { id: foreignOrder.id },
    });
    expect(after.order_status).toBe("NEW");
  });

  it("rejectOrderAction refuses to cancel another shop's order", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts();

    const foreignOrder = await createOrderAtStatus({
      shop_id: seededB.shop.id,
      order_status: "NEW",
    });

    asUser(seededA.owner);
    await expect(
      rejectOrderAction(foreignOrder.id, "not yours")
    ).rejects.toMatchObject({ name: "BadRequestError" });

    const after = await testPrisma.order.findUniqueOrThrow({
      where: { id: foreignOrder.id },
    });
    expect(after.order_status).toBe("NEW");
  });
});

describe("IDOR: another user's cart (GET /api/cart)", () => {
  it("a caller's cart at a shop is never another buyer's cart, even when both exist at the same shop", async () => {
    const shop = await createShop();
    const product = await createProduct({ shop_id: shop.id, price: 100 });

    const bob = await createUser();
    const bobsCart = await testPrisma.cart.create({
      data: {
        user_id: bob.id,
        shop_id: shop.id,
        items: { create: [{ product_id: product.id, quantity: 3 }] },
      },
    });

    const alice = await createUser();
    asUser(alice);

    const res = await GET_CART(
      new NextRequest(`http://localhost/api/cart?shop_id=${shop.id}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.data.id).not.toBe(bobsCart.id);
    expect(body.data.items).toEqual([]);
  });
});

describe("IDOR (new hole, fixed as part of this task): updateProductAction had no shop-ownership check", () => {
  it("a vendor cannot update another shop's product, and the row is left unchanged", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts({ productCount: 1 });
    const foreignProduct = seededB.products[0];

    const before = await testPrisma.product.findUniqueOrThrow({
      where: { id: foreignProduct.id },
    });

    asUser(seededA.owner);

    const rejection = updateProductAction(foreignProduct.id, {
      name: "Hijacked Name",
      price: 1,
      stock_quantity: 999,
      discount: 90,
    });

    await expect(rejection).rejects.toMatchObject({ name: "ForbiddenError" });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(
        seededB.shop.id
      );
    });

    const after = await testPrisma.product.findUniqueOrThrow({
      where: { id: foreignProduct.id },
    });
    expect(after.name).toBe(before.name);
    expect(after.price.toString()).toBe(before.price.toString());
    expect(after.stock_quantity).toBe(before.stock_quantity);
  });
});
