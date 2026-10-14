import { callArg, mockOf } from "@tests/helpers";
import { beforeEach, describe, expect, it, type Mocked } from "vitest";

import type {
  BrandRepository,
  CategoryRepository,
  ProductRepository,
  ShopRepository,
} from "@/repositories";

import { DBSearchService } from "./db-search.service";

const date = new Date("2030-01-01T00:00:00Z");

const productRow = (overrides: Record<string, unknown> = {}) => ({
  id: "prod-1",
  name: "Prod 1",
  description: "Desc",
  price: "10.5",
  discount: "5",
  stock_quantity: 5,
  image_key: "p.png",
  category_id: "cat-1",
  category: { name: "Cat 1" },
  shop_id: "shop-1",
  shop: { id: "shop-1", name: "Shop 1", is_active: true },
  brand_id: "brand-1",
  brand: { name: "Brand 1" },
  is_veg: true,
  created_at: date,
  updated_at: date,
  ...overrides,
});

const shopRow = {
  id: "shop-1",
  name: "Shop 1",
  description: "Snacks",
  location: "Block A",
  image_key: "s.png",
  is_active: true,
  created_at: date,
};

type Where = Record<string, unknown>;

describe("DBSearchService", () => {
  let service: DBSearchService;
  let productRepo: Mocked<ProductRepository>;
  let shopRepo: Mocked<ShopRepository>;
  let categoryRepo: Mocked<CategoryRepository>;
  let brandRepo: Mocked<BrandRepository>;

  beforeEach(() => {
    productRepo = mockOf<ProductRepository>();
    shopRepo = mockOf<ShopRepository>();
    categoryRepo = mockOf<CategoryRepository>();
    brandRepo = mockOf<BrandRepository>();
    service = new DBSearchService(
      productRepo,
      shopRepo,
      categoryRepo,
      brandRepo
    );

    productRepo.findMany.mockResolvedValue([] as never);
    productRepo.count.mockResolvedValue(0);
    shopRepo.findMany.mockResolvedValue([] as never);
    shopRepo.count.mockResolvedValue(0);
    categoryRepo.findMany.mockResolvedValue([] as never);
    categoryRepo.count.mockResolvedValue(0);
    brandRepo.findMany.mockResolvedValue([] as never);
    brandRepo.count.mockResolvedValue(0);
  });

  const productQuery = () =>
    callArg<{ where: Where; orderBy: object; take: number; skip: number }>(
      productRepo.findMany
    );

  describe("searchProducts", () => {
    it("applies every filter and maps hits", async () => {
      productRepo.findMany.mockResolvedValue([productRow()] as never);
      productRepo.count.mockResolvedValue(21);

      const result = await service.searchProducts({
        query: "  pen ",
        shopId: "shop-1",
        categoryId: "cat-1",
        minPrice: 1,
        maxPrice: 50,
        inStock: true,
        brand_id: "brand-1",
        is_veg: false,
        shop_type: "CANTEEN",
        page: 3,
        limit: 10,
        sortBy: "price",
        sortOrder: "asc",
      });

      const q = productQuery();
      expect(q.where).toMatchObject({
        deleted_at: null,
        shop: { is_active: true, deleted_at: null, shop_type: "CANTEEN" },
        shop_id: "shop-1",
        category_id: "cat-1",
        price: { gte: 1, lte: 50 },
        stock_quantity: { gt: 0 },
        brand_id: "brand-1",
        is_veg: false,
      });
      expect(q.where.OR).toHaveLength(5);
      expect(q.where.OR).toContainEqual({
        name: { contains: "pen", mode: "insensitive" },
      });
      expect(q).toMatchObject({
        take: 10,
        skip: 20,
        orderBy: { price: "asc" },
      });
      expect(productRepo.count).toHaveBeenCalledWith({ where: q.where });
      expect(result).toEqual({
        hits: [
          {
            id: "prod-1",
            name: "Prod 1",
            description: "Desc",
            price: 10.5,
            discount: 5,
            stock_quantity: 5,
            image_key: "p.png",
            category_id: "cat-1",
            category_name: "Cat 1",
            shop_id: "shop-1",
            shop_name: "Shop 1",
            shop_is_active: true,
            created_at: date.toISOString(),
            updated_at: date.toISOString(),
            brand_id: "brand-1",
            brand_name: "Brand 1",
            is_veg: true,
          },
        ],
        total: 21,
        page: 3,
        total_pages: 3,
      });
    });

    it("uses defaults and maps missing optional fields to null", async () => {
      productRepo.findMany.mockResolvedValue([
        productRow({
          description: undefined,
          discount: null,
          category: null,
          brand: null,
          is_veg: undefined,
        }),
      ] as never);

      const result = await service.searchProducts({ query: "   " });

      const q = productQuery();
      expect(q.where).toEqual({
        deleted_at: null,
        shop: { is_active: true, deleted_at: null },
      });
      expect(q).toMatchObject({
        take: 10,
        skip: 0,
        orderBy: { created_at: "desc" },
      });
      expect(result.hits[0]).toMatchObject({
        description: null,
        discount: null,
        category_name: null,
        brand_name: null,
        is_veg: null,
      });
      expect(result).toMatchObject({ page: 1, total: 0, total_pages: 0 });
    });

    it.each([
      [{ minPrice: 5 }, { gte: 5, lte: undefined }],
      [{ maxPrice: 0 }, { gte: undefined, lte: 0 }],
    ])("builds an open price range for %j", async (range, price) => {
      await service.searchProducts(range);

      expect(productQuery().where.price).toEqual(price);
    });

    it("filters out-of-stock products when inStock is false", async () => {
      await service.searchProducts({ inStock: false });

      expect(productQuery().where.stock_quantity).toEqual({ lte: 0 });
    });

    it("falls back to created_at for an unknown sort field", async () => {
      await service.searchProducts({ sortBy: "hacked", sortOrder: "asc" });

      expect(productQuery().orderBy).toEqual({ created_at: "asc" });
    });
  });

  describe("searchShops", () => {
    it("searches active shops by text, ordered by name", async () => {
      shopRepo.findMany.mockResolvedValue([shopRow] as never);
      shopRepo.count.mockResolvedValue(1);

      const result = await service.searchShops({
        query: " snack ",
        page: 2,
        limit: 5,
      });

      const q = callArg<{ where: Where }>(shopRepo.findMany);
      expect(q).toMatchObject({
        where: { deleted_at: null, is_active: true },
        take: 5,
        skip: 5,
        orderBy: { name: "asc" },
      });
      expect(q.where.OR).toContainEqual({
        location: { contains: "snack", mode: "insensitive" },
      });
      expect(result).toEqual({
        hits: [{ ...shopRow, created_at: date.toISOString() }],
        total: 1,
        page: 2,
        total_pages: 1,
      });
    });

    it("lists newest shops without a query and honours isActive=false", async () => {
      await service.searchShops({ isActive: false });

      expect(callArg(shopRepo.findMany)).toEqual({
        where: { deleted_at: null, is_active: false },
        take: 10,
        skip: 0,
        orderBy: { created_at: "desc" },
      });
    });
  });

  describe.each([
    ["searchCategories", () => categoryRepo] as const,
    ["searchBrands", () => brandRepo] as const,
  ])("%s", (method, repo) => {
    it("filters by name and maps hits", async () => {
      repo().findMany.mockResolvedValue([{ id: "x1", name: "X" }] as never);
      repo().count.mockResolvedValue(1);

      const result = await service[method]({ query: " x ", page: 2, limit: 4 });

      expect(repo().findMany).toHaveBeenCalledWith({
        where: { name: { contains: "x", mode: "insensitive" } },
        take: 4,
        skip: 4,
        orderBy: { name: "asc" },
      });
      expect(result).toEqual({
        hits: [{ id: "x1", name: "X" }],
        total: 1,
        page: 2,
        total_pages: 1,
      });
    });

    it("lists everything without a query", async () => {
      await service[method]({});

      expect(repo().findMany).toHaveBeenCalledWith({
        where: {},
        take: 10,
        skip: 0,
        orderBy: { name: "asc" },
      });
    });
  });

  describe("globalSearch", () => {
    it("aggregates shops, products, categories and brands", async () => {
      productRepo.findMany.mockResolvedValue([productRow()] as never);
      shopRepo.findMany.mockResolvedValue([shopRow] as never);
      categoryRepo.findMany.mockResolvedValue([
        { id: "cat-1", name: "Cat 1" },
      ] as never);
      brandRepo.findMany.mockResolvedValue([
        { id: "brand-1", name: "Brand 1" },
      ] as never);

      const result = await service.globalSearch("test query");

      expect(result).toEqual([
        {
          id: "shop-1",
          title: "Shop 1",
          subtitle: "Block A",
          type: "shop",
          image_key: "s.png",
        },
        {
          id: "prod-1",
          title: "Prod 1",
          subtitle: "Shop 1",
          type: "product",
          image_key: "p.png",
          shop_id: "shop-1",
        },
        {
          id: "cat-1",
          title: "Cat 1",
          subtitle: "category",
          type: "category",
          image_key: null,
        },
        {
          id: "brand-1",
          title: "Brand 1",
          subtitle: "brand",
          type: "brand",
          image_key: null,
        },
      ]);
      expect(productQuery().take).toBe(5);
    });

    it.each(["", "   "])("returns [] for blank query %j", async (query) => {
      await expect(service.globalSearch(query)).resolves.toEqual([]);
      expect(productRepo.findMany).not.toHaveBeenCalled();
    });
  });
});
