import { describe, expect, it } from "vitest";

import {
  futureSlotTime,
  seedCartForShop,
  seedCartReadyForCheckout,
  seedOpenBatch,
  seedShopWithProducts,
} from "../factories";
import { testPrisma } from "../setup/integration-setup";

describe("factories", () => {
  it("seeds a cart that satisfies the checkout preconditions", async () => {
    const { user, shop, cart, address } = await seedCartReadyForCheckout();

    expect(cart.items).toHaveLength(2);
    expect(cart.user_id).toBe(user.id);
    expect(cart.shop_id).toBe(shop.id);
    expect(address.user_id).toBe(user.id);

    const persisted = await testPrisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user.id, shop_id: shop.id } },
      include: { items: true },
    });
    expect(persisted?.items).toHaveLength(2);
  });

  it("seeds reference data after every reset", async () => {
    await expect(testPrisma.platformSettings.count()).resolves.toBe(1);
    await expect(testPrisma.building.count()).resolves.toBe(1);
  });

  it("produces unique values across calls", async () => {
    const a = await seedCartReadyForCheckout();
    const b = await seedCartReadyForCheckout();
    expect(a.user.email).not.toBe(b.user.email);
  });

  it("links the owner to the shop it seeds, not the reverse", async () => {
    const { shop, owner, products } = await seedShopWithProducts({
      productCount: 3,
    });

    expect(products).toHaveLength(3);
    const persistedOwner = await testPrisma.user.findUnique({
      where: { id: owner.id },
    });
    expect(persistedOwner?.shop_id).toBe(shop.id);
  });

  it("seeds a second buyer's cart at an existing shop", async () => {
    const { shop } = await seedShopWithProducts();
    const { user, cart } = await seedCartForShop(shop);

    expect(cart.shop_id).toBe(shop.id);
    expect(cart.user_id).toBe(user.id);
  });

  it("seeds an open batch with a slot findOrCreateBatchForRequestedTime accepts", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const batch = await seedOpenBatch({ cutoffAt: at });

    expect(batch.status).toBe("OPEN");
    expect(batch.cutoff_time.getTime()).toBe(at.getTime());

    const slot = await testPrisma.batchSlot.findFirst({
      where: { shop_id: batch.shop_id, cutoff_time_minutes: cutoffMinutes },
    });
    expect(slot).not.toBeNull();
    expect(slot?.is_active).toBe(true);
  });
});
