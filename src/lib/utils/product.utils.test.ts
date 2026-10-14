import {
  makeProduct,
  makeSerializedProduct,
} from "@tests/helpers/lib/builders";
import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/client";
import type { FullCart } from "@/types";

import {
  createDefaultFilterState,
  type FilterState,
  getProductCountMessage,
  getProductStates,
  ProductUIServices,
  productUIServices,
  serializeFullCart,
  serializeFullCarts,
  serializeProduct,
  serializeProducts,
} from "./product.utils";

const D = Prisma.Decimal;
const shopRef = { id: "shop-1", name: "Canteen" };
const filters = (overrides: Partial<FilterState> = {}): FilterState => ({
  ...createDefaultFilterState(),
  ...overrides,
});

describe("getProductCountMessage", () => {
  it.each([
    [0, 5, "No products found"],
    [1, 1, "Showing all 1 product"],
    [3, 3, "Showing all 3 products"],
    [1, 2, "Showing 1 of 2 products"],
    [0, 0, "No products found"],
  ])("(%i, %i) -> %s", (display, total, expected) => {
    expect(getProductCountMessage(display, total)).toBe(expected);
  });

  it("uses the singular for a total of one with a partial display", () => {
    // display !== total with total === 1 is only reachable with display > 1.
    expect(getProductCountMessage(2, 1)).toBe("Showing 2 of 1 product");
  });
});

describe("getProductStates", () => {
  const p = makeSerializedProduct();

  it("describes a populated, unfiltered list", () => {
    expect(getProductStates([p], [p], false, false)).toEqual({
      allProducts: [p],
      displayProducts: [p],
      showFilters: true,
      showNoMatchMessage: false,
      productCountMessage: "Showing all 1 product",
      isEmptyState: false,
      isEmpty: false,
    });
  });

  it("shows a no-match message when filters hide everything", () => {
    const state = getProductStates([p], [], true, false);

    expect(state.showNoMatchMessage).toBe(true);
    expect(state.productCountMessage).toBe("No products found");
  });

  it.each([
    [false, true],
    [true, false],
  ])("empty list while loading=%s -> isEmptyState=%s", (loading, expected) => {
    const state = getProductStates([], [], false, loading);

    expect(state.isEmpty).toBe(true);
    expect(state.showFilters).toBe(false);
    expect(state.isEmptyState).toBe(expected);
  });
});

describe("serializeProduct(s)", () => {
  it("converts Decimals and computes the average rating", () => {
    const result = serializeProduct({
      ...makeProduct({
        price: new D("120.50"),
        discount: new D("10"),
        rating_sum: 9,
        review_count: 2,
      }),
      shop: shopRef,
      category: { id: "c", name: "Snacks" },
      brand: { id: "b", name: "Amul" },
    });

    expect(result).toMatchObject({
      price: 120.5,
      discount: 10,
      rating: 4.5,
      category: { id: "c", name: "Snacks" },
      brand: { id: "b", name: "Amul" },
    });
  });

  it("defaults missing discount, category, brand and rating", () => {
    const result = serializeProduct({ ...makeProduct(), shop: null });

    expect(result).toMatchObject({
      discount: null,
      category: null,
      brand: null,
      rating: 0,
    });
  });

  it("serializes a list", () => {
    const rows = [
      {
        ...makeProduct({ id: "a" }),
        shop: shopRef,
        category: null,
        brand: null,
      },
      {
        ...makeProduct({ id: "b" }),
        shop: shopRef,
        category: null,
        brand: null,
      },
    ];

    expect(serializeProducts(rows).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("serializeFullCart(s)", () => {
  const cart = {
    id: "cart-1",
    user_id: "u",
    shop_id: "shop-1",
    items: [
      {
        id: "ci-1",
        quantity: 2,
        cart_id: "cart-1",
        product_id: "product-1",
        product: {
          ...makeProduct(),
          category: null,
          brand: null,
          shop: {
            ...shopRef,
            qr_image_key: "qr",
            upi_id: "upi",
            opening: "09:00",
            closing: "21:00",
            accepting_orders: true,
            default_delivery_fee: new D("10"),
            direct_delivery_fee: new D("20"),
            min_order_value: new D("50"),
          },
        },
      },
    ],
  } as unknown as FullCart;

  it("stringifies shop money fields and serializes the product", () => {
    const [item] = serializeFullCart(cart).items;

    expect(item.product).toMatchObject({
      price: 100,
      category: null,
      brand: null,
      shop: {
        default_delivery_fee: "10",
        direct_delivery_fee: "20",
        min_order_value: "50",
        upi_id: "upi",
      },
    });
  });

  it("serializes several carts", () => {
    expect(serializeFullCarts([cart, cart])).toHaveLength(2);
  });
});

describe("ProductUIServices", () => {
  const svc = new ProductUIServices();

  it("exports a ready-made instance", () => {
    expect(productUIServices).toBeInstanceOf(ProductUIServices);
  });

  it.each([
    [100, null, 100],
    [100, 0, 100],
    [100, -5, 100],
    [200, 25, 150],
  ])("price %i with discount %s -> %i", (price, discount, expected) => {
    expect(
      svc.calculateDiscountedPrice(makeSerializedProduct({ price, discount }))
    ).toBe(expected);
  });

  it("formats dates in the local format", () => {
    const date = new Date(2026, 0, 2);

    expect(svc.formatProductDate(date)).toBe(date.toLocaleDateString());
    expect(svc.formatProductDate(date.toISOString())).toBe(
      date.toLocaleDateString()
    );
  });

  it("builds a simple count message", () => {
    expect(svc.getProductCountMessage(2, 5)).toBe("Showing 2 of 5 products");
  });

  it("lists sort options as 'field-order' values", () => {
    const options = svc.getSortOptions();

    expect(options).toHaveLength(8);
    for (const { value } of options) {
      expect(value).toMatch(/^(created_at|name|price|rating)-(asc|desc)$/);
    }
  });

  describe("applyAllFilters", () => {
    const tea = makeSerializedProduct({
      id: "tea",
      name: "Tea",
      description: "Masala chai",
      price: 20,
      stock_quantity: 0,
      rating: 4,
      created_at: new Date("2026-01-03"),
    });
    const bun = makeSerializedProduct({
      id: "bun",
      name: "Bun",
      description: null,
      price: 10,
      stock_quantity: 3,
      rating: 5,
      created_at: new Date("2026-01-01"),
    });
    const cake = makeSerializedProduct({
      id: "cake",
      name: "Cake",
      description: "Chocolate",
      price: 50,
      stock_quantity: 1,
      rating: 3,
      created_at: new Date("2026-01-02"),
    });
    const all = [tea, bun, cake];
    const ids = (f: FilterState) =>
      svc.applyAllFilters(all, f).map((p) => p.id);

    it.each<[string, Partial<FilterState>, string[]]>([
      ["default (newest first)", {}, ["tea", "cake", "bun"]],
      ["search by name, case-insensitive", { search: "TEA" }, ["tea"]],
      ["search by description", { search: "chocolate" }, ["cake"]],
      ["search with no match", { search: "pizza" }, []],
      ["price range", { priceRange: { min: 15, max: 40 } }, ["tea"]],
      ["in stock", { inStock: true }, ["cake", "bun"]],
      ["out of stock", { inStock: false }, ["tea"]],
      [
        "name asc",
        { sortBy: "name", sortOrder: "asc" },
        ["bun", "cake", "tea"],
      ],
      [
        "price desc",
        { sortBy: "price", sortOrder: "desc" },
        ["cake", "tea", "bun"],
      ],
      [
        "rating asc",
        { sortBy: "rating", sortOrder: "asc" },
        ["cake", "tea", "bun"],
      ],
      [
        "created asc",
        { sortBy: "created_at", sortOrder: "asc" },
        ["bun", "cake", "tea"],
      ],
      [
        "unknown sort keeps order",
        { sortBy: "unknown" as FilterState["sortBy"], sortOrder: "asc" },
        ["tea", "bun", "cake"],
      ],
    ])("%s", (_label, overrides, expected) => {
      expect(ids(filters(overrides))).toEqual(expected);
    });
  });

  it.each<[Partial<FilterState>, boolean]>([
    [{}, false],
    [{ search: "x" }, true],
    [{ priceRange: { min: 1, max: 100000 } }, true],
    [{ priceRange: { min: 0, max: 10 } }, true],
    [{ inStock: false }, true],
    [{ categoryId: "c" }, true],
  ])("hasActiveFilters(%j) -> %s", (overrides, expected) => {
    expect(svc.hasActiveFilters(filters(overrides))).toBe(expected);
  });

  it("parses a sort value", () => {
    expect(svc.parseSortValueToOptions("price-asc")).toEqual({
      sortBy: "price",
      sortOrder: "asc",
    });
  });

  it.each([
    [null, null, { min: 0, max: 100000 }],
    [5, 50, { min: 5, max: 50 }],
  ])("handlePriceRangeChange(%s, %s)", (min, max, expected) => {
    expect(svc.handlePriceRangeChange(min, max)).toEqual(expected);
  });

  describe("createActiveFilters", () => {
    const clearSearch = vi.fn();
    const clearPrice = vi.fn();
    const clearStock = vi.fn();
    const build = (overrides: Partial<FilterState>) =>
      svc.createActiveFilters(
        filters(overrides),
        clearSearch,
        clearPrice,
        clearStock
      );

    it("is empty for default filters", () => {
      expect(build({})).toEqual([]);
    });

    it("lists every active filter with its clear callback", () => {
      expect(
        build({
          search: "tea",
          priceRange: { min: 10, max: 100000 },
          inStock: true,
        })
      ).toEqual([
        { label: "Search", value: "tea", onRemove: clearSearch },
        { label: "Price", value: "10 - ∞", onRemove: clearPrice },
        { label: "In Stock", value: "", onRemove: clearStock },
      ]);
    });

    it("shows a bounded price range and out-of-stock filter", () => {
      expect(
        build({ priceRange: { min: 0, max: 50 }, inStock: false })
      ).toEqual([
        { label: "Price", value: "0 - 50", onRemove: clearPrice },
        { label: "Out of Stock", value: "", onRemove: clearStock },
      ]);
    });
  });

  it("creates updaters that forward partial filter updates", () => {
    const update = vi.fn();
    const u = svc.createFilterUpdaters(update);

    u.updateSearch("tea");
    u.updatePriceRange(1, 2);
    u.updateStockFilter(true);
    u.updateCategoryFilter("c");
    u.updateSort("name", "asc");
    u.clearSearchFilter();
    u.clearPriceFilter();
    u.clearStockFilter();
    u.clearCategoryFilter();

    expect(update.mock.calls.map(([arg]) => arg)).toEqual([
      { search: "tea" },
      { priceRange: { min: 1, max: 2 } },
      { inStock: true },
      { categoryId: "c" },
      { sortBy: "name", sortOrder: "asc" },
      { search: "" },
      { priceRange: { min: 0, max: 100000 } },
      { inStock: null },
      { categoryId: null },
    ]);
  });

  it("groups products by category, alphabetically with Uncategorized last", () => {
    const cat = (name: string) => ({ id: name, name });
    const a = makeSerializedProduct({ id: "a", category: cat("Snacks") });
    const b = makeSerializedProduct({ id: "b", category: null });
    const c = makeSerializedProduct({ id: "c", category: cat("Drinks") });
    const d = makeSerializedProduct({ id: "d", category: cat("Snacks") });

    const groups = svc.groupProductsByCategory([b, a, c, d]);

    expect(
      groups.map((g) => [g.categoryName, g.products.map((p) => p.id)])
    ).toEqual([
      ["Drinks", ["c"]],
      ["Snacks", ["a", "d"]],
      ["Uncategorized", ["b"]],
    ]);
  });

  it("puts Uncategorized last regardless of input order", () => {
    const a = makeSerializedProduct({
      id: "a",
      category: { id: "z", name: "Zebra" },
    });
    const b = makeSerializedProduct({ id: "b", category: null });

    expect(
      svc.groupProductsByCategory([a, b]).map((g) => g.categoryName)
    ).toEqual(["Zebra", "Uncategorized"]);
  });
});
