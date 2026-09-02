import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BrandRepository,
  CategoryRepository,
  ProductRepository,
  ShopRepository,
} from "@/repositories";

import { DBSearchService } from "./db-search.service";

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("DBSearchService", () => {
  let service: DBSearchService;
  let productRepo: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let shopRepo: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let categoryRepo: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let brandRepo: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    productRepo = {
      findMany: vi.fn(),
      count: vi.fn(),
    };
    shopRepo = {
      findMany: vi.fn(),
      count: vi.fn(),
    };
    categoryRepo = {
      findMany: vi.fn(),
      count: vi.fn(),
    };
    brandRepo = {
      findMany: vi.fn(),
      count: vi.fn(),
    };

    service = new DBSearchService(
      productRepo as unknown as ProductRepository,
      shopRepo as unknown as ShopRepository,
      categoryRepo as unknown as CategoryRepository,
      brandRepo as unknown as BrandRepository
    );
  });

  describe("searchProducts", () => {
    it("should search products with filters", async () => {
      const date = new Date();
      productRepo.findMany.mockResolvedValue([
        {
          id: "prod-1",
          name: "Prod 1",
          price: 10,
          stock_quantity: 5,
          shop: { id: "shop-1", name: "Shop 1", is_active: true },
          created_at: date,
          updated_at: date,
        },
      ]);
      productRepo.count.mockResolvedValue(1);

      const result = await service.searchProducts({
        query: "test",
        shopId: "shop-1",
        inStock: true,
      });

      expect(productRepo.findMany).toHaveBeenCalled();
      const whereArgs = productRepo.findMany.mock.calls[0][0].where;
      expect(whereArgs.shop_id).toBe("shop-1");
      expect(whereArgs.stock_quantity).toEqual({ gt: 0 });
      expect(whereArgs.OR).toBeDefined(); // query search
      expect(result.hits[0].id).toBe("prod-1");
      expect(result.total).toBe(1);
    });
  });

  describe("globalSearch", () => {
    it("should search across all entities and aggregate results", async () => {
      const date = new Date();
      productRepo.findMany.mockResolvedValue([
        {
          id: "prod-1",
          name: "Prod 1",
          price: 10,
          shop: { id: "shop-1", name: "Shop 1", is_active: true },
          created_at: date,
          updated_at: date,
        },
      ]);
      productRepo.count.mockResolvedValue(1);

      shopRepo.findMany.mockResolvedValue([
        { id: "shop-1", name: "Shop 1", created_at: date },
      ]);
      shopRepo.count.mockResolvedValue(1);

      categoryRepo.findMany.mockResolvedValue([{ id: "cat-1", name: "Cat 1" }]);
      categoryRepo.count.mockResolvedValue(1);

      brandRepo.findMany.mockResolvedValue([
        { id: "brand-1", name: "Brand 1" },
      ]);
      brandRepo.count.mockResolvedValue(1);

      const result = await service.globalSearch("test query");

      expect(result.length).toBe(4);
      expect(result.find((r) => r.type === "shop")).toBeDefined();
      expect(result.find((r) => r.type === "product")).toBeDefined();
      expect(result.find((r) => r.type === "category")).toBeDefined();
      expect(result.find((r) => r.type === "brand")).toBeDefined();
    });

    it("should return empty array for empty query", async () => {
      const result = await service.globalSearch("   ");
      expect(result).toEqual([]);
      expect(productRepo.findMany).not.toHaveBeenCalled();
    });
  });
});
