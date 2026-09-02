import { beforeEach,describe, expect, it, vi } from "vitest";

import { Prisma, Product } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { serializeProducts } from "@/lib/utils";
import { ProductRepository } from "@/repositories/product.repository";

import { ProductService } from "./product.service";

vi.mock("@/lib/utils", () => ({
  serializeProducts: vi.fn((x) => x),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("ProductService", () => {
  let productRepository: ProductRepository;
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productRepository = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      findManyByShopId: vi.fn(),
    } as unknown as ProductRepository;

    productService = new ProductService(productRepository);
  });

  describe("createProduct", () => {
    it("delegates to repository", async () => {
      const data = { name: "Test" } as any;
      const expected = { id: "prod-1" } as Product;
      vi.mocked(productRepository.create).mockResolvedValue(expected);

      const result = await productService.createProduct(data);
      expect(result).toBe(expected);
      expect(productRepository.create).toHaveBeenCalledWith({ data });
    });
  });

  describe("updateProduct", () => {
    it("delegates to repository", async () => {
      const data = { name: "Test2" } as any;
      const expected = { id: "prod-1" } as Product;
      vi.mocked(productRepository.update).mockResolvedValue(expected);

      const result = await productService.updateProduct("prod-1", data);
      expect(result).toBe(expected);
      expect(productRepository.update).toHaveBeenCalledWith("prod-1", data);
    });

    it("returns null if not found", async () => {
      // @ts-expect-error Mocking return null
      vi.mocked(productRepository.update).mockResolvedValue(null);
      const result = await productService.updateProduct("prod-1", {});
      expect(result).toBeNull();
    });
  });

  describe("deleteProduct", () => {
    it("delegates to repository", async () => {
      const expected = { id: "prod-1" } as Product;
      vi.mocked(productRepository.delete).mockResolvedValue(expected);

      const result = await productService.deleteProduct("prod-1");
      expect(result).toBe(expected);
      expect(productRepository.delete).toHaveBeenCalledWith("prod-1");
    });
  });

  describe("getProductById", () => {
    it("includes shop and category", async () => {
      const expected = { id: "prod-1" } as any;
      vi.mocked(productRepository.findById).mockResolvedValue(expected);

      const result = await productService.getProductById("prod-1");
      expect(result).toBe(expected);
      expect(productRepository.findById).toHaveBeenCalledWith("prod-1", {
        include: {
          shop: { select: { id: true, name: true } },
          category: true,
        },
      });
    });
  });

  describe("getPaginatedProducts", () => {
    it("handles no filters and no cursor", async () => {
      const products = [{ id: "prod-1" }] as Product[];
      vi.mocked(productRepository.findMany).mockResolvedValue([...products]);

      const result = await productService.getPaginatedProducts({ limit: 10 });
      expect(result).toEqual({
        initialProducts: products,
        hasNextPage: false,
        nextCursor: null,
      });

      expect(productRepository.findMany).toHaveBeenCalledWith({
        take: 11,
        where: {
          shop: { is_active: true, deleted_at: null },
          deleted_at: null,
        },
        orderBy: { orderItems: { _count: Prisma.SortOrder.desc } },
        include: {
          shop: { select: { id: true, name: true } },
          category: true,
          brand: true,
        },
      });
    });

    it("adds cursor and skip when cursor is provided", async () => {
      vi.mocked(productRepository.findMany).mockResolvedValue([]);

      await productService.getPaginatedProducts({ limit: 10, cursor: "prod-1" });
      expect(productRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: "prod-1" },
          skip: 1,
        })
      );
    });

    it("adds category_id to where when categoryId is provided", async () => {
      vi.mocked(productRepository.findMany).mockResolvedValue([]);

      await productService.getPaginatedProducts({ limit: 10, categoryId: "cat-1" });
      expect(productRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category_id: "cat-1",
          }),
        })
      );
    });

    it("adds discount filter when hasDiscount is provided", async () => {
      vi.mocked(productRepository.findMany).mockResolvedValue([]);

      await productService.getPaginatedProducts({ limit: 10, hasDiscount: true });
      expect(productRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            discount: { not: null, gt: 0 },
          }),
        })
      );
    });

    it("returns hasNextPage true and nextCursor when products.length > limit", async () => {
      const products = [{ id: "prod-1" }, { id: "prod-2" }] as Product[];
      vi.mocked(productRepository.findMany).mockResolvedValue([...products]);

      const result = await productService.getPaginatedProducts({ limit: 1 });
      expect(result).toEqual({
        initialProducts: [{ id: "prod-1" }],
        hasNextPage: true,
        nextCursor: "prod-2",
      });
    });
  });

  describe("searchProducts", () => {
    it("verifies OR clause and default limit", async () => {
      const expected = [{ id: "prod-1" }] as any[];
      vi.mocked(productRepository.findMany).mockResolvedValue(expected);

      const result = await productService.searchProducts("test");
      expect(result).toBe(expected);
      expect(productRepository.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "test", mode: "insensitive" } },
            { description: { contains: "test", mode: "insensitive" } },
          ],
          shop: { is_active: true },
        },
        include: { shop: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
        take: 10,
      });
    });

    it("uses custom limit", async () => {
      vi.mocked(productRepository.findMany).mockResolvedValue([]);
      await productService.searchProducts("test", 5);
      expect(productRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  describe("fetchShopProducts", () => {
    it("returns hasNextPage false for <= 10 products", async () => {
      const products = [{ id: "prod-1" }] as Product[];
      vi.mocked(productRepository.findManyByShopId).mockResolvedValue([...products]);

      const result = await productService.fetchShopProducts("shop-1");
      expect(result).toEqual({
        initialProducts: products,
        hasNextPage: false,
        nextCursor: null,
      });
      expect(productRepository.findManyByShopId).toHaveBeenCalledWith("shop-1", {
        take: 11,
        orderBy: { created_at: Prisma.SortOrder.desc },
        include: {
          shop: { select: { id: true, name: true } },
          category: true,
          brand: true,
        },
      });
    });

    it("returns hasNextPage true and nextCursor for > 10 products", async () => {
      const products = Array.from({ length: 11 }, (_, i) => ({ id: `prod-${i + 1}` })) as Product[];
      vi.mocked(productRepository.findManyByShopId).mockResolvedValue([...products]);

      const result = await productService.fetchShopProducts("shop-1");
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe("prod-11");
      expect(result.initialProducts).toHaveLength(10);
    });

    it("returns error path on exception", async () => {
      vi.mocked(productRepository.findManyByShopId).mockRejectedValue(new Error("DB Error"));

      const result = await productService.fetchShopProducts("shop-1");
      expect(result).toEqual({
        initialProducts: [],
        hasNextPage: false,
        nextCursor: null,
        error: "Failed to load products. Please try again.",
      });
    });
  });
});
