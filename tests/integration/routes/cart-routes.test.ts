import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET as GET_ALL_CARTS } from "../../../src/app/api/cart/all/route";
import { GET as GET_CART } from "../../../src/app/api/cart/route";
import { createShop, createUser, seedCartForShop } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("GET /api/cart", () => {
  it("returns 500 when signed out (authUtils throws UnauthenticatedError; the handler's catch has no special case for it)", async () => {
    asAnonymous();
    const shop = await createShop();
    const res = await GET_CART(
      new NextRequest(`http://localhost/api/cart?shop_id=${shop.id}`)
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(true);
  });

  it("returns 400 when shop_id is missing, even when signed in", async () => {
    const user = await createUser();
    asUser(user);
    const res = await GET_CART(new NextRequest("http://localhost/api/cart"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.details).toMatch(/shop_id/i);
  });

  it("returns 200 and an empty cart (find-or-create) for a shop the caller has no cart at yet", async () => {
    const user = await createUser();
    const shop = await createShop();
    asUser(user);

    const res = await GET_CART(
      new NextRequest(`http://localhost/api/cart?shop_id=${shop.id}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.shop_id).toBe(shop.id);
    expect(body.data.user_id).toBe(user.id);
    expect(body.data.items).toEqual([]);

    await expect(
      testPrisma.cart.findUnique({
        where: { user_id_shop_id: { user_id: user.id, shop_id: shop.id } },
      })
    ).resolves.not.toBeNull();
  });

  it("returns 200 with the caller's existing cart items and product details for that shop", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    void owner;
    const { user, cart, product } = await seedCartForShop(shop);
    asUser(user);

    const res = await GET_CART(
      new NextRequest(`http://localhost/api/cart?shop_id=${shop.id}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(cart.id);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].product_id).toBe(product.id);
    expect(body.data.items[0].product.id).toBe(product.id);
  });
});

describe("GET /api/cart/all", () => {
  it("returns 500 when signed out (same generic catch as /api/cart — no UnauthenticatedError special case)", async () => {
    asAnonymous();
    const res = await GET_ALL_CARTS();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(true);
  });

  it("returns 200 with an empty array when the caller has no carts", async () => {
    const user = await createUser();
    asUser(user);
    const res = await GET_ALL_CARTS();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 200 with every cart belonging to the caller, across shops", async () => {
    const shopA = await createShop();
    const ownerA = await createUser({ shop_id: shopA.id });
    void ownerA;
    const shopB = await createShop();
    const ownerB = await createUser({ shop_id: shopB.id });
    void ownerB;

    const user = await createUser();
    const cartA = await testPrisma.cart.create({
      data: { user_id: user.id, shop_id: shopA.id },
    });
    const cartB = await testPrisma.cart.create({
      data: { user_id: user.id, shop_id: shopB.id },
    });

    asUser(user);
    const res = await GET_ALL_CARTS();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data.map((c: { id: string }) => c.id).sort()).toEqual(
      [cartA.id, cartB.id].sort()
    );
  });
});
