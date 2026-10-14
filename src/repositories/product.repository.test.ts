import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";

import { ProductRepository } from "./product.repository";

describe("ProductRepository", () => {
  let prisma: PrismaMock;
  let repo: ProductRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    repo = new ProductRepository(asPrisma(prisma));
  });

  describe("findById", () => {
    it("calls findFirst with scope hardening", async () => {
      await repo.findById("prod-1");
      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", deleted_at: null },
      });
    });

    it("passes through include options AND enforces scope keys", async () => {
      await repo.findById("prod-1", { include: { shop: true } });
      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        include: { shop: true },
        where: { id: "prod-1", deleted_at: null },
      });
    });

    it("overwrites caller deleted_at in where clause", async () => {
      await repo.findById("prod-1", {
        where: { deleted_at: new Date() },
      } as unknown as Omit<Prisma.ProductFindFirstArgs, "where">);
      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", deleted_at: null },
      });
    });
  });

  describe("findUnique", () => {
    it("delegates directly", async () => {
      await repo.findUnique({ where: { id: "prod-1" } });
      expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      });
    });
  });

  describe("findMany", () => {
    it("delegates directly", async () => {
      await repo.findMany({ where: { shop_id: "shop-1" } });
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1" },
      });
    });
  });

  describe("create", () => {
    it("delegates directly", async () => {
      const data = {
        name: "test",
        shop_id: "shop-1",
      } as unknown as Prisma.ProductCreateInput;
      await repo.create({ data });
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
      expect(prisma.product.create).toHaveBeenCalledWith({ data });
    });
  });

  describe("update", () => {
    it("string overload calls update with where id and data", async () => {
      await repo.update("prod-1", { name: "new name" });
      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { name: "new name" },
      });
    });

    it("string overload with options applies scope hardening", async () => {
      await repo.update("prod-1", { name: "new name" }, {
        include: { shop: true },
        where: { id: "other" },
      } as unknown as Omit<Prisma.ProductUpdateArgs, "where" | "data">);
      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        include: { shop: true },
        where: { id: "prod-1" },
        data: { name: "new name" },
      });
    });

    it("args overload delegates directly", async () => {
      await repo.update({ where: { id: "prod-1" }, data: { name: "test" } });
      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { name: "test" },
      });
    });
  });

  describe("delete", () => {
    it("string overload performs soft delete", async () => {
      await repo.delete("prod-1");
      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it("args overload performs soft delete", async () => {
      await repo.delete({ where: { id: "prod-1" } });
      expect(prisma.product.update).toHaveBeenCalledTimes(1);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });

  describe("hardDelete", () => {
    it("calls product delete with id", async () => {
      await repo.hardDelete("prod-1");
      expect(prisma.product.delete).toHaveBeenCalledTimes(1);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      });
    });
  });

  describe("findManyByShopId", () => {
    it("calls findMany with scope hardening", async () => {
      await repo.findManyByShopId("shop-1");
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", deleted_at: null },
      });
    });

    it("overwrites caller shop_id in where clause", async () => {
      await repo.findManyByShopId("shop-1", { where: { shop_id: "other" } });
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", deleted_at: null },
      });
    });
  });

  describe("count", () => {
    it("delegates directly", async () => {
      await repo.count({ where: { shop_id: "shop-1" } });
      expect(prisma.product.count).toHaveBeenCalledTimes(1);
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { shop_id: "shop-1" },
      });
    });
  });

  describe("findStockWatch", () => {
    it("calls findUnique with compound key", async () => {
      await repo.findStockWatch("user-1", "prod-1");
      expect(prisma.stockWatch.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.stockWatch.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_product_id: { user_id: "user-1", product_id: "prod-1" },
        },
      });
    });
  });

  describe("createStockWatch", () => {
    it("delegates directly", async () => {
      await repo.createStockWatch("user-1", "prod-1");
      expect(prisma.stockWatch.create).toHaveBeenCalledTimes(1);
      expect(prisma.stockWatch.create).toHaveBeenCalledWith({
        data: { user_id: "user-1", product_id: "prod-1" },
      });
    });
  });

  describe("deleteStockWatch", () => {
    it("delegates directly", async () => {
      await repo.deleteStockWatch("sw-1");
      expect(prisma.stockWatch.delete).toHaveBeenCalledTimes(1);
      expect(prisma.stockWatch.delete).toHaveBeenCalledWith({
        where: { id: "sw-1" },
      });
    });
  });

  describe("getStockWatches", () => {
    it("applies scope hardening on user_id", async () => {
      await repo.getStockWatches("user-1", {
        include: { product: true },
        where: { user_id: "other" },
      } as unknown as Parameters<typeof repo.getStockWatches>[1]);
      expect(prisma.stockWatch.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.stockWatch.findMany).toHaveBeenCalledWith({
        include: { product: true },
        where: { user_id: "user-1" },
      });
    });
  });

  describe("getStockWatchersByProductId", () => {
    it("applies scope hardening on product_id", async () => {
      await repo.getStockWatchersByProductId("prod-1", {
        where: { product_id: "other" },
      } as unknown as Parameters<typeof repo.getStockWatchersByProductId>[1]);
      expect(prisma.stockWatch.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.stockWatch.findMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("deleteStockWatchesByProductId", () => {
    it("delegates directly", async () => {
      await repo.deleteStockWatchesByProductId("prod-1");
      expect(prisma.stockWatch.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.stockWatch.deleteMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("searchProducts", () => {
    it("trims search term and constructs correct query", async () => {
      await repo.searchProducts("  term  ", 5);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      const args = prisma.product.findMany.mock.calls[0][0];

      expect(args.take).toBe(5);
      expect(args.where.deleted_at).toBeNull();
      expect(args.where.shop).toEqual({ is_active: true, deleted_at: null });
      expect(args.where.OR).toBeDefined();
      expect(args.where.OR).toContainEqual({
        name: { contains: "term", mode: "insensitive" },
      });
      expect(args.where.OR).toContainEqual({
        description: { contains: "term", mode: "insensitive" },
      });
      expect(args.where.OR).toContainEqual({
        category: { name: { contains: "term", mode: "insensitive" } },
      });
      expect(args.where.OR).toContainEqual({
        shop: { name: { contains: "term", mode: "insensitive" } },
      });
    });

    it("handles empty search term by excluding OR clause", async () => {
      await repo.searchProducts("   ");
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      const args = prisma.product.findMany.mock.calls[0][0];

      expect(args.where.deleted_at).toBeNull();
      expect(args.where.shop).toEqual({ is_active: true, deleted_at: null });
      expect(args.where.OR).toBeUndefined();
    });
  });

  describe("scope hardening edge cases", () => {
    it("findById returns what findFirst resolves", async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: "prod-1" });
      await expect(repo.findById("prod-1")).resolves.toEqual({ id: "prod-1" });
    });

    it("hardDelete keeps extra args but forces the product id", async () => {
      await repo.hardDelete("prod-1", {
        select: { id: true },
        where: { id: "other" },
      } as unknown as Parameters<typeof repo.hardDelete>[1]);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "prod-1" },
      });
    });

    it("findManyByShopId ANDs caller filters and keeps take/orderBy", async () => {
      await repo.findManyByShopId("shop-1", {
        where: { name: "x", deleted_at: { not: null } },
        take: 3,
        orderBy: { name: "asc" },
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        take: 3,
        orderBy: { name: "asc" },
        where: { name: "x", shop_id: "shop-1", deleted_at: null },
      });
    });

    it("update(id) without data sends an empty data object", async () => {
      await repo.update(
        "prod-1",
        undefined as unknown as Prisma.ProductUpdateInput
      );
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {},
      });
    });

    it("getStockWatches queries by user only without options", async () => {
      await repo.getStockWatches("user-1");
      expect(prisma.stockWatch.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
      });
    });

    it("getStockWatchersByProductId queries by product only without options", async () => {
      await repo.getStockWatchersByProductId("prod-1");
      expect(prisma.stockWatch.findMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("searchProducts shape", () => {
    it("selects shop id/name, sorts by name and defaults to 10 results", async () => {
      const rows = [{ id: "p1", shop: { id: "s1", name: "Shop" } }];
      prisma.product.findMany.mockResolvedValueOnce(rows);

      const result = await repo.searchProducts("tea");

      const args = prisma.product.findMany.mock.calls[0][0];
      expect(args.include).toEqual({
        shop: { select: { id: true, name: true } },
      });
      expect(args.orderBy).toEqual({ name: "asc" });
      expect(args.take).toBe(10);
      expect(result).toBe(rows);
    });
  });
});
