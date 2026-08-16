import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { cancelOrderAction } from "../../../src/actions/orders/order-actions";
import {
  deleteProductAction,
  updateProductAction,
} from "../../../src/actions/product/product-actions";
import { createReviewAction } from "../../../src/actions/product/review-action";
import {
  acceptOrderAction,
  rejectOrderAction,
} from "../../../src/actions/shop/order-management-actions";
import {
  deleteUserAddress,
  updateUserAddress,
} from "../../../src/actions/user";
import { setDefaultAddressAction } from "../../../src/actions/user-addresses/user-address-actions";
import { GET as GET_CART } from "../../../src/app/api/cart/route";
import { GET as GET_ORDER } from "../../../src/app/api/orders/[order_id]/route";
import { GET as GET_SELLER_ORDERS } from "../../../src/app/api/seller/orders/route";
import {
  createOrderAtStatus,
  createProduct,
  createShop,
  createUser,
  createUserAddress,
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

describe("IDOR (destructive hole, fixed as part of Fix D): deleteProductAction had no shop-ownership check", () => {
  // deleteProductAction fetched the product with `shop_id` selected and
  // never compared it to the caller's shop — the same missing check as
  // updateProductAction above, except destructive and irreversible: any
  // vendor could permanently delete any other shop's product, and the
  // delete path also fired "removed from your cart" notifications to the
  // victim shop's customers before the (missing) check would have
  // rejected it. Fixed in
  // src/actions/product/product-actions.ts:deleteProductAction by adding
  // the ownership check immediately after the existence check and before
  // any side effect (cart notifications, then the delete itself), plus
  // the same selective rethrow updateProductAction's fix added.
  it("a vendor cannot delete another shop's product, and the row still exists afterward", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts({ productCount: 1 });
    const foreignProduct = seededB.products[0];

    const before = await testPrisma.product.findUniqueOrThrow({
      where: { id: foreignProduct.id },
    });

    asUser(seededA.owner);

    const rejection = deleteProductAction(foreignProduct.id);

    await expect(rejection).rejects.toMatchObject({ name: "ForbiddenError" });
    // Assertion standard (order-actions-error-types.test.ts,
    // idor.test.ts's updateProductAction coverage above): a denial must
    // also assert the rejection carries none of the victim's identifying
    // data — here, the victim shop's id.
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(
        seededB.shop.id
      );
    });

    // The critical assertion: the product must still exist. A test that
    // only asserts the throw would pass even if the delete happened
    // before the (missing) check rejected the call.
    const after = await testPrisma.product.findUnique({
      where: { id: foreignProduct.id },
    });
    expect(after).not.toBeNull();
    expect(after?.name).toBe(before.name);
    expect(after?.shop_id).toBe(before.shop_id);
  });
});

describe("IDOR (additional hole, found while auditing product/ for Fix D): createReviewAction had no order-item-ownership check", () => {
  // ReviewService.createReview took `order_item_id` from the caller and
  // connected a Review to it without ever checking that the order item
  // belonged to the caller. Since `order_item_id` is @unique on Review
  // (prisma/schema.prisma), any authenticated user who obtained another
  // user's order_item_id could permanently consume that order item's one
  // review slot with an arbitrary rating/comment — before the legitimate
  // buyer ever got to review it themselves. Fixed in
  // src/services/review/review.service.ts:createReview by checking the
  // order item's `order.user_id` (and its actual `product_id`) against
  // the caller before creating the review.
  it("a user cannot attach a review to another user's order item, and no review is created", async () => {
    const { shop, products } = await seedShopWithProducts({ productCount: 1 });
    const product = products[0];

    const victim = await createUser();
    const victimOrder = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "COMPLETED",
      user_id: victim.id,
    });
    const orderItem = await testPrisma.orderItem.create({
      data: {
        order_id: victimOrder.id,
        product_id: product.id,
        quantity: 1,
        price: 100,
      },
    });

    const attacker = await createUser();
    asUser(attacker);

    const rejection = createReviewAction({
      product_id: product.id,
      order_item_id: orderItem.id,
      rating: 1,
      comment: "hijacked review",
    });

    await expect(rejection).rejects.toMatchObject({ name: "ForbiddenError" });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(victim.id);
    });

    const review = await testPrisma.review.findUnique({
      where: { order_item_id: orderItem.id },
    });
    expect(review).toBeNull();
  });
});

describe("IDOR (additional hole, found while auditing user-addresses/ for Fix D): setDefaultAddressAction had no address-ownership check", () => {
  // UserAddressRepository.setDefault(user_id, address_id) cleared the
  // caller's own `is_default` flags but then ran
  // `userAddress.update({ where: { id: address_id }, ... })` with no
  // check that `address_id` belonged to `user_id` — any authenticated
  // user could flip `is_default: true` on another user's address row.
  // Fixed in src/repositories/user-address.repository.ts:setDefault by
  // checking ownership first (matching updateWithDefault /
  // deleteByIdAndUserId's existing pattern) and returning null when the
  // address isn't the caller's, which the action now turns into a
  // ForbiddenError.
  it("a user cannot set another user's address as their default, and neither row changes", async () => {
    const victim = await createUser();
    const victimAddress = await createUserAddress({
      user_id: victim.id,
      is_default: false,
    });

    const attacker = await createUser();
    const attackerAddress = await createUserAddress({
      user_id: attacker.id,
      is_default: true,
    });

    asUser(attacker);

    const rejection = setDefaultAddressAction(victimAddress.id);

    await expect(rejection).rejects.toMatchObject({ name: "ForbiddenError" });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(victim.id);
    });

    const victimAfter = await testPrisma.userAddress.findUniqueOrThrow({
      where: { id: victimAddress.id },
    });
    expect(victimAfter.is_default).toBe(false);

    const attackerAfter = await testPrisma.userAddress.findUniqueOrThrow({
      where: { id: attackerAddress.id },
    });
    expect(attackerAfter.is_default).toBe(true);
  });
});

describe("IDOR (C3, live authenticated IDOR): deleteUserAddress had no ownership check at all", () => {
  // src/actions/user/index.ts:deleteUserAddress checked authentication, then
  // called `userAddressRepository.delete(id)` with a caller-supplied id and
  // NO ownership check — any authenticated user could delete any other
  // user's address. It is reachable despite not being imported by any
  // client component: the file has a top-level "use server" directive, so
  // every exported async function is registered as a callable server
  // action and appears in the build manifest regardless of whether
  // anything in the app calls it. Fixed by routing through
  // `deleteByIdAndUserId`, matching `deleteAddressAction`'s existing,
  // correctly-scoped pattern.
  it("rejects deleting another user's address, and the victim's address still exists afterward", async () => {
    const victim = await createUser();
    const victimAddress = await createUserAddress({ user_id: victim.id });

    const attacker = await createUser();
    asUser(attacker);

    const rejection = deleteUserAddress(victimAddress.id);

    await expect(rejection).rejects.toMatchObject({ name: "ForbiddenError" });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(victim.id);
      expect(String((error as Error).message)).not.toContain(
        victimAddress.id
      );
    });

    const after = await testPrisma.userAddress.findUnique({
      where: { id: victimAddress.id },
    });
    expect(after).not.toBeNull();
    expect(after?.user_id).toBe(victim.id);
  });
});

describe("IDOR (I1, wrong id in the first repository parameter): updateUserAddress could not succeed for its owner and could not touch anyone else's row either", () => {
  // src/actions/user/index.ts:updateUserAddress called
  // `userAddressRepository.update(user_id, {...})` — the repository's
  // first parameter is the ADDRESS id, not the user id, so this compiled
  // to `where: { id: user_id }`, which always threw P2025 (a UserAddress
  // row's id is never a user's id). Same shape as the
  // CartService.upsertCartItem cart-id/user-id defect this branch already
  // fixed elsewhere in a prior wave. Fixed by accepting the address id
  // explicitly (via `updateUserAddressSchema`, which already existed but
  // was unused here) and routing through `updateWithDefault(id, user_id,
  // data)`, which both orders the ids correctly AND checks ownership.
  it("rejects updating another user's address, and the victim's address is unchanged", async () => {
    const victim = await createUser();
    const victimAddress = await createUserAddress({
      user_id: victim.id,
      label: "Victim's Room",
      room_number: "101",
    });

    const attacker = await createUser();
    asUser(attacker);

    const rejection = updateUserAddress({
      id: victimAddress.id,
      label: "Hijacked",
      building: "Hijacked Hall",
      room_number: "999",
      is_default: false,
    });

    await expect(rejection).rejects.toMatchObject({ name: "ForbiddenError" });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(victim.id);
      expect(String((error as Error).message)).not.toContain(
        victimAddress.id
      );
    });

    const after = await testPrisma.userAddress.findUniqueOrThrow({
      where: { id: victimAddress.id },
    });
    expect(after.label).toBe("Victim's Room");
    expect(after.room_number).toBe("101");
  });

  it("succeeds for the address's actual owner, proving the id-order fix (not just the ownership guard) is correct", async () => {
    const owner = await createUser();
    const address = await createUserAddress({
      user_id: owner.id,
      label: "Old Label",
      room_number: "101",
    });

    asUser(owner);

    await updateUserAddress({
      id: address.id,
      label: "New Label",
      building: "Test Hostel",
      room_number: "202",
      is_default: false,
    });

    const after = await testPrisma.userAddress.findUniqueOrThrow({
      where: { id: address.id },
    });
    expect(after.label).toBe("New Label");
    expect(after.room_number).toBe("202");
  });
});
