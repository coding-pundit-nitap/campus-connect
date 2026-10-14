import { describe, expect, it } from "vitest";

import type { OrderHistoryParams } from "@/services";
import { OrderStatus } from "@/types/prisma.types";

import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it.each<[string, readonly unknown[], readonly unknown[]]>([
    ["users.orders", queryKeys.users.orders("u1"), ["users", "u1", "orders"]],
    [
      "users.profile",
      queryKeys.users.profile("u1"),
      ["users", "u1", "profile"],
    ],
    ["users.addresses", queryKeys.users.addresses(), ["users", "addresses"]],
    ["cart.byShop", queryKeys.cart.byShop("s1"), ["cart", "shop", "s1"]],
    ["shops.detail", queryKeys.shops.detail("s1"), ["shops", "s1"]],
    [
      "shops.products",
      queryKeys.shops.products("s1"),
      ["shops", "s1", "products"],
    ],
    [
      "shops.categories",
      queryKeys.shops.categories("q"),
      ["shops", "categories", { query: "q" }],
    ],
    [
      "shops.brands",
      queryKeys.shops.brands("q"),
      ["shops", "brands", { query: "q" }],
    ],
    ["shops.byUser", queryKeys.shops.byUser(), ["shops", "user", "current"]],
    [
      "products.list",
      queryKeys.products.list({ limit: 5 }),
      ["products", "list", { limit: 5 }],
    ],
    [
      "products.byShop",
      queryKeys.products.byShop("s1"),
      ["products", "shop", "s1"],
    ],
    [
      "products.byShopWithFilters",
      queryKeys.products.byShopWithFilters("s1", { search: "tea" }),
      ["products", "shop", "s1", "filtered", { search: "tea" }],
    ],
    ["products.detail", queryKeys.products.detail("p1"), ["products", "p1"]],
    [
      "products.reviews",
      queryKeys.products.reviews("p1"),
      ["products", "p1", "reviews"],
    ],
    [
      "products.byOrderItem",
      queryKeys.products.byOrderItem("oi1"),
      ["products", "by-order-item", "oi1"],
    ],
    ["orders.byUser", queryKeys.orders.byUser("u1"), ["orders", "user", "u1"]],
    ["orders.byShop", queryKeys.orders.byShop("s1"), ["orders", "shop", "s1"]],
    ["orders.detail", queryKeys.orders.detail("o1"), ["orders", "o1"]],
    ["seller.orders", queryKeys.seller.orders(), ["seller", "orders"]],
    ["seller.dashboard", queryKeys.seller.dashboard(), ["seller", "dashboard"]],
    [
      "seller.earnings",
      queryKeys.seller.earnings("week"),
      ["seller", "earnings", "week"],
    ],
    [
      "seller.orderHistory",
      queryKeys.seller.orderHistory({
        page: 1,
      } as unknown as OrderHistoryParams),
      ["seller", "order-history", { page: 1 }],
    ],
    ["search.query", queryKeys.search.query("x"), ["search", "query", "x"]],
    [
      "search.products",
      queryKeys.search.products("x"),
      ["search", "products", "x"],
    ],
    [
      "search.productSearch",
      queryKeys.search.productSearch({
        q: "x",
        type: "all",
        veg: true,
        brand_id: null,
      }),
      [
        "search",
        "productSearch",
        { q: "x", type: "all", veg: true, brand_id: null },
      ],
    ],
    [
      "search.orders",
      queryKeys.search.orders("x", { status: OrderStatus.NEW }),
      ["search", "orders", "x", { status: "NEW" }],
    ],
    [
      "search.brands",
      queryKeys.search.brands("GROCERY"),
      ["search", "brands", "GROCERY"],
    ],
    [
      "notifications.history",
      queryKeys.notifications.history(),
      ["notifications", "history"],
    ],
    [
      "notifications.summary",
      queryKeys.notifications.summary(),
      ["notifications", "summary"],
    ],
    ["health.database", queryKeys.health.database(), ["health", "database"]],
    [
      "buildings.shopDelivery",
      queryKeys.buildings.shopDelivery(),
      ["buildings", "shop-delivery"],
    ],
    [
      "batch.vendorDashboard",
      queryKeys.batch.vendorDashboard(),
      ["batch", "vendor", "dashboard"],
    ],
    [
      "batch.nextSlot",
      queryKeys.batch.nextSlot("s1"),
      ["batch", "next-slot", "s1"],
    ],
    [
      "batch.progress",
      queryKeys.batch.progress("s1"),
      ["batch", "progress", "s1"],
    ],
    [
      "batch.summary",
      queryKeys.batch.summary("b1"),
      ["batch", "b1", "summary"],
    ],
    ["batch.active", queryKeys.batch.active(), ["batch", "active"]],
    [
      "batch.directDeliveries",
      queryKeys.batch.directDeliveries(),
      ["batch", "direct-deliveries"],
    ],
    [
      "batch.deliveryRun",
      queryKeys.batch.deliveryRun(),
      ["batch", "delivery-run"],
    ],
    [
      "batch.orderConsole",
      queryKeys.batch.orderConsole(),
      ["batch", "order-console"],
    ],
  ])("%s builds the expected key", (_name, actual, expected) => {
    expect(actual).toEqual(expected);
  });

  it.each(Object.entries(queryKeys))(
    "%s has a single-segment base key used for broad invalidation",
    (group, keys) => {
      expect((keys as { all: readonly string[] }).all).toEqual([group]);
    }
  );

  it("exposes static keys for the current user", () => {
    expect(queryKeys.users.me).toEqual(["users", "me"]);
    expect(queryKeys.users.favorites).toEqual(["users", "favorites"]);
    expect(queryKeys.users.stockWatches).toEqual(["users", "stock-watches"]);
  });
});
