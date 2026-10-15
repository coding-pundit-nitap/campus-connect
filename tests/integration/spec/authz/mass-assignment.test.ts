// Mass assignment: server actions and routes receive arbitrary JSON from the
// client, so every field that decides ownership, trust or money must come
// from the server, never from the payload.
// (`as never` smuggles fields the action's TypeScript type does not allow.)
import { describe, expect, it } from "vitest";

import { updateProductAction } from "../../../../src/actions/product/product-actions";
import {
  createShopAction,
  updateShopAction,
} from "../../../../src/actions/shop/shop-actions";
import { updateUser } from "../../../../src/actions/user";
import {
  createAddressAction,
  updateAddressAction,
} from "../../../../src/actions/user-addresses/user-address-actions";
import { createAnnouncementAction } from "../../../../src/actions/vendor/announcement-actions";
import { createBatchSlotAction } from "../../../../src/actions/vendor/batch-slot-actions";
import { PUT as PUT_ME } from "../../../../src/app/api/users/me/route";
import {
  createShop,
  createUser,
  createUserAddress,
  seedShopWithProducts,
} from "../../../factories";
import { jsonReq } from "../../../helpers/spec-authz";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

const shopForm = {
  name: "Honest Shop",
  description: "A perfectly ordinary shop",
  location: "Hall A",
  opening: "09:00",
  closing: "21:00",
  upi_id: "honest@upi",
  min_order_value: 50,
  batch_slots: [],
  default_delivery_fee: 10,
  direct_delivery_fee: 20,
};

const shopTrustFields = {
  is_active: true,
  verification_status: "VERIFIED",
  pg_seller_id: "pg-forged",
};

const addressForm = {
  label: "Room",
  building: "Hall A",
  room_number: "101",
  is_default: false,
};

async function expectProfileUntouched(user: { id: string; email: string }) {
  const after = await testPrisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });
  expect(after.name).toBe("Renamed User");
  expect(after).toMatchObject({
    role: "USER",
    status: "ACTIVE",
    shop_id: null,
    email: user.email,
  });
}

describe("a user cannot set their own role, status, shop or e-mail", () => {
  const privileged = (shop_id: string) => ({
    name: "Renamed User",
    role: "ADMIN",
    status: "BANNED",
    shop_id,
    email: "admin@takeover.test",
  });

  it("PUT /api/users/me changes the name but ignores role, status, shop_id and email", async () => {
    const shop = await createShop();
    const user = await createUser();
    asUser(user);

    const res = await PUT_ME(
      jsonReq("/api/users/me", "PUT", privileged(shop.id))
    );

    expect(res.status).toBe(200);
    await expectProfileUntouched(user);
  });

  it("updateUser ignores role, status, shop_id and email", async () => {
    const shop = await createShop();
    const user = await createUser();
    asUser(user);

    await updateUser(privileged(shop.id) as never);

    await expectProfileUntouched(user);
  });
});

describe("shop trust fields and image keys never come from the payload", () => {
  it("createShopAction ignores is_active, verification_status, pg_seller_id and a foreign owner", async () => {
    const victim = await createUser();
    const user = await createUser();
    asUser(user);

    await createShopAction({
      ...shopForm,
      ...shopTrustFields,
      user: { connect: { id: victim.id } },
      user_id: victim.id,
    } as never);

    const shop = await testPrisma.shop.findFirstOrThrow({
      where: { name: shopForm.name },
      include: { user: true },
    });
    expect(shop).toMatchObject({
      is_active: false,
      verification_status: "NOT_STARTED",
      pg_seller_id: null,
    });
    expect(shop.user?.id).toBe(user.id);
  });

  it("updateShopAction ignores trust fields and cannot repoint image_key / qr_image_key at another shop's objects", async () => {
    const { shop: own, owner } = await seedShopWithProducts({
      productCount: 0,
      shopOverrides: { is_active: false },
    });
    const other = await createShop();
    asUser(owner);

    await updateShopAction({
      ...shopForm,
      ...shopTrustFields,
      image_key: other.image_key,
      qr_image_key: other.qr_image_key,
    } as never);

    const after = await testPrisma.shop.findUniqueOrThrow({
      where: { id: own.id },
    });
    expect(after.name).toBe(shopForm.name);
    expect(after).toMatchObject({
      is_active: false,
      verification_status: "NOT_STARTED",
      pg_seller_id: null,
      image_key: own.image_key,
      qr_image_key: own.qr_image_key,
    });
  });
});

describe("a product's shop, ratings and image key never come from the payload", () => {
  it("updateProductAction ignores shop_id, rating_sum, review_count and a foreign image_key", async () => {
    const { owner, products } = await seedShopWithProducts({ productCount: 1 });
    const other = await seedShopWithProducts({ productCount: 1 });
    const product = products[0];
    asUser(owner);

    await updateProductAction(product.id, {
      name: "Renamed product",
      description: "Still the same product",
      price: 120,
      stock_quantity: 5,
      discount: 0,
      image_key: other.products[0].image_key,
      shop_id: other.shop.id,
      rating_sum: 500,
      review_count: 100,
    } as never);

    const after = await testPrisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(after.name).toBe("Renamed product");
    expect(after).toMatchObject({
      shop_id: product.shop_id,
      rating_sum: product.rating_sum,
      review_count: product.review_count,
      image_key: product.image_key,
    });
  });
});

describe("an address always belongs to the caller", () => {
  it("createAddressAction ignores user / user_id from the payload", async () => {
    const victim = await createUser();
    const user = await createUser();
    asUser(user);

    for (const owner of [
      { user: { connect: { id: victim.id } } },
      { user_id: victim.id },
    ]) {
      await createAddressAction({ ...addressForm, ...owner } as never);
    }

    expect(
      await testPrisma.userAddress.count({ where: { user_id: victim.id } })
    ).toBe(0);
    expect(
      await testPrisma.userAddress.count({ where: { user_id: user.id } })
    ).toBe(2);
  });

  it("updateAddressAction cannot move the caller's address to another user", async () => {
    const victim = await createUser();
    const user = await createUser();
    const address = await createUserAddress({ user_id: user.id });
    asUser(user);

    await updateAddressAction({
      id: address.id,
      data: { ...addressForm, user: { connect: { id: victim.id } } } as never,
    });

    const after = await testPrisma.userAddress.findUniqueOrThrow({
      where: { id: address.id },
    });
    expect(after.user_id).toBe(user.id);
    expect(after.label).toBe(addressForm.label);
  });
});

describe("announcements and batch slots are created on the caller's shop", () => {
  async function ownAndOtherShop() {
    const { shop: own, owner } = await seedShopWithProducts({
      productCount: 0,
    });
    const other = await createShop();
    asUser(owner);
    return { own, other };
  }

  it("createAnnouncementAction ignores shop_id from the payload", async () => {
    const { own, other } = await ownAndOtherShop();

    await createAnnouncementAction({
      title: "Hello",
      message: "World",
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      shop_id: other.id,
    } as never);

    const where = (shop_id: string) => ({ where: { shop_id } });
    expect(await testPrisma.shopAnnouncement.count(where(other.id))).toBe(0);
    expect(await testPrisma.shopAnnouncement.count(where(own.id))).toBe(1);
  });

  it("createBatchSlotAction ignores shop_id from the payload", async () => {
    const { own, other } = await ownAndOtherShop();

    await createBatchSlotAction({
      cutoff_time_minutes: 600,
      shop_id: other.id,
    } as never);

    const where = (shop_id: string) => ({ where: { shop_id } });
    expect(await testPrisma.batchSlot.count(where(other.id))).toBe(0);
    expect(await testPrisma.batchSlot.count(where(own.id))).toBe(1);
  });
});
