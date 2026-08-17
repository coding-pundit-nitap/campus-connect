
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { toggleProductStockAction } from "../../../src/actions/product/product-actions";
import * as stockWatchActions from "../../../src/actions/products/stock-watch-actions";
import { Role } from "../../../src/generated/client";
import { verifyAdmin } from "../../../src/lib/verify-admin";
import {
  createProduct,
  createShop,
  createUser,
} from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("stock-watch-actions.ts no longer exposes an internal helper as an endpoint", () => {
  it("only exports the legitimate client-callable action", () => {
    expect(Object.keys(stockWatchActions).sort()).toEqual([
      "toggleStockWatchAction",
    ]);
  });
});

describe("src/actions/authentication/admin.ts is gone", () => {
  it("the former accidental-endpoint file no longer exists on disk", () => {
    const removedPath = path.resolve(
      __dirname,
      "../../../src/actions/authentication/admin.ts"
    );
    expect(fs.existsSync(removedPath)).toBe(false);
  });
});

describe("verifyAdmin relocated to src/lib/verify-admin.ts still behaves correctly", () => {
  it("returns the admin's id for an authenticated admin", async () => {
    const admin = await createUser({ role: Role.ADMIN });
    asUser(admin);

    await expect(verifyAdmin()).resolves.toBe(admin.id);
  });

  it("rejects a non-admin caller", async () => {
    const user = await createUser({ role: Role.USER });
    asUser(user);

    await expect(verifyAdmin()).rejects.toMatchObject({
      name: "ForbiddenError",
    });
  });
});

describe("notifyStockWatchers relocated to services/notification, invoked only via the legitimate restock path", () => {
  it("notifies and clears watchers for the restocked product only — an unrelated watcher's row on a different product is untouched", async () => {
    const shop = await createShop({ accepting_orders: true });
    const owner = await createUser({ shop_id: shop.id });
    const restockedProduct = await createProduct({
      shop_id: shop.id,
      stock_quantity: 0,
    });
    const otherProduct = await createProduct({
      shop_id: shop.id,
      stock_quantity: 5,
    });

    const watcher = await createUser();
    const watchOnRestocked = await testPrisma.stockWatch.create({
      data: { user_id: watcher.id, product_id: restockedProduct.id },
    });

    const victim = await createUser();
    const victimWatch = await testPrisma.stockWatch.create({
      data: { user_id: victim.id, product_id: otherProduct.id },
    });

    asUser(owner);
    const result = await toggleProductStockAction(restockedProduct.id, true);
    expect(result.success).toBe(true);

    const consumedWatch = await testPrisma.stockWatch.findUnique({
      where: { id: watchOnRestocked.id },
    });
    expect(consumedWatch).toBeNull();

    const untouchedWatch = await testPrisma.stockWatch.findUnique({
      where: { id: victimWatch.id },
    });
    expect(untouchedWatch).not.toBeNull();
    expect(untouchedWatch?.user_id).toBe(victim.id);
    expect(untouchedWatch?.product_id).toBe(otherProduct.id);
  });
});
