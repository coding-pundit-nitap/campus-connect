import { describe, expect, it } from "vitest";

import authUtils from "../../../src/lib/utils/auth.utils.server";
import { Role } from "../../../src/types/prisma.types";
import { createShop, createUser } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";

describe("auth helpers", () => {
  it("resolves the user id when signed in", async () => {
    const user = await createUser();
    asUser(user);
    await expect(authUtils.getUserId()).resolves.toBe(user.id);
  });

  it("throws when signed out", async () => {
    asAnonymous();
    await expect(authUtils.getUserId()).rejects.toThrow();
  });

  it("is anonymous by default, without ever calling asUser", async () => {
    await expect(authUtils.getUserId()).rejects.toThrow();
    await expect(authUtils.isAuthenticated()).resolves.toBe(false);
  });

  it("resolves true when signed in", async () => {
    const user = await createUser();
    asUser(user);
    await expect(authUtils.isAuthenticated()).resolves.toBe(true);
  });

  it("reports a plain user as not a seller", async () => {
    const user = await createUser();
    asUser(user);
    await expect(authUtils.isSeller()).resolves.toBe(false);
  });

  it("reports a user with a shop_id as a seller", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    asUser(owner);
    await expect(authUtils.isSeller()).resolves.toBe(true);
  });

  it("returns the owned shop id for a vendor", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    asUser(owner);
    await expect(authUtils.getOwnedShopId()).resolves.toBe(shop.id);
  });

  it("rejects getOwnedShopId for a user with no shop", async () => {
    const user = await createUser();
    asUser(user);
    await expect(authUtils.getOwnedShopId()).rejects.toThrow();
  });

  it("reports isAdmin false for a plain user", async () => {
    const user = await createUser({ role: Role.USER });
    asUser(user);
    await expect(authUtils.isAdmin()).resolves.toBe(false);
  });

  it("reports isAdmin true for an admin", async () => {
    const admin = await createUser({ role: Role.ADMIN });
    asUser(admin);
    await expect(authUtils.isAdmin()).resolves.toBe(true);
  });
});
