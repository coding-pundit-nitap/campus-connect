import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import type { prisma } from "@/lib/prisma";

import { ProductRepository } from "./product.repository";

function buildFakePrismaClient() {
  const productFindFirst = vi.fn().mockResolvedValue(null);
  const productFindUnique = vi.fn().mockResolvedValue(null);
  const productFindMany = vi.fn().mockResolvedValue([]);
  const productCreate = vi.fn().mockResolvedValue({ id: "prod-1" });
  const productUpdate = vi.fn().mockResolvedValue({ id: "prod-1" });
  const productDelete = vi.fn().mockResolvedValue({ id: "prod-1" });
  const productCount = vi.fn().mockResolvedValue(0);

  const stockWatchFindUnique = vi.fn().mockResolvedValue(null);
  const stockWatchCreate = vi.fn().mockResolvedValue({ id: "sw-1" });
  const stockWatchDelete = vi.fn().mockResolvedValue({ id: "sw-1" });
  const stockWatchFindMany = vi.fn().mockResolvedValue([]);
  const stockWatchDeleteMany = vi.fn().mockResolvedValue({ count: 1 });

  const fakeClient = {
    product: {
      findFirst: productFindFirst,
      findUnique: productFindUnique,
      findMany: productFindMany,
      create: productCreate,
      update: productUpdate,
      delete: productDelete,
      count: productCount,
    },
    stockWatch: {
      findUnique: stockWatchFindUnique,
      create: stockWatchCreate,
      delete: stockWatchDelete,
      findMany: stockWatchFindMany,
      deleteMany: stockWatchDeleteMany,
    },
  };

  return {
    fakeClient,
    productFindFirst,
    productFindUnique,
    productFindMany,
    productCreate,
    productUpdate,
    productDelete,
    productCount,
    stockWatchFindUnique,
    stockWatchCreate,
    stockWatchDelete,
    stockWatchFindMany,
    stockWatchDeleteMany,
  };
}

describe("ProductRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findById", () => {
    it("calls findFirst with scope hardening", async () => {
      const { fakeClient, productFindFirst } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findById("prod-1");
      expect(productFindFirst).toHaveBeenCalledTimes(1);
      expect(productFindFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", deleted_at: null },
      });
    });

    it("passes through include options AND enforces scope keys", async () => {
      const { fakeClient, productFindFirst } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findById("prod-1", { include: { shop: true } });
      expect(productFindFirst).toHaveBeenCalledTimes(1);
      expect(productFindFirst).toHaveBeenCalledWith({
        include: { shop: true },
        where: { id: "prod-1", deleted_at: null },
      });
    });

    it("overwrites caller deleted_at in where clause", async () => {
      const { fakeClient, productFindFirst } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findById("prod-1", {
        where: { deleted_at: new Date() },
      } as unknown as Omit<Prisma.ProductFindFirstArgs, "where">);
      expect(productFindFirst).toHaveBeenCalledTimes(1);
      expect(productFindFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", deleted_at: null },
      });
    });
  });

  describe("findUnique", () => {
    it("delegates directly", async () => {
      const { fakeClient, productFindUnique } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findUnique({ where: { id: "prod-1" } });
      expect(productFindUnique).toHaveBeenCalledTimes(1);
      expect(productFindUnique).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      });
    });
  });

  describe("findMany", () => {
    it("delegates directly", async () => {
      const { fakeClient, productFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findMany({ where: { shop_id: "shop-1" } });
      expect(productFindMany).toHaveBeenCalledTimes(1);
      expect(productFindMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1" },
      });
    });
  });

  describe("create", () => {
    it("delegates directly", async () => {
      const { fakeClient, productCreate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      const data = {
        name: "test",
        shop_id: "shop-1",
      } as unknown as Prisma.ProductCreateInput;
      await repo.create({ data });
      expect(productCreate).toHaveBeenCalledTimes(1);
      expect(productCreate).toHaveBeenCalledWith({ data });
    });
  });

  describe("update", () => {
    it("string overload calls update with where id and data", async () => {
      const { fakeClient, productUpdate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.update("prod-1", { name: "new name" });
      expect(productUpdate).toHaveBeenCalledTimes(1);
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { name: "new name" },
      });
    });

    it("string overload with options applies scope hardening", async () => {
      const { fakeClient, productUpdate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.update("prod-1", { name: "new name" }, {
        include: { shop: true },
        where: { id: "other" },
      } as unknown as Omit<Prisma.ProductUpdateArgs, "where" | "data">);
      expect(productUpdate).toHaveBeenCalledTimes(1);
      expect(productUpdate).toHaveBeenCalledWith({
        include: { shop: true },
        where: { id: "prod-1" },
        data: { name: "new name" },
      });
    });

    it("args overload delegates directly", async () => {
      const { fakeClient, productUpdate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.update({ where: { id: "prod-1" }, data: { name: "test" } });
      expect(productUpdate).toHaveBeenCalledTimes(1);
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { name: "test" },
      });
    });
  });

  describe("delete", () => {
    it("string overload performs soft delete", async () => {
      const { fakeClient, productUpdate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.delete("prod-1");
      expect(productUpdate).toHaveBeenCalledTimes(1);
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it("args overload performs soft delete", async () => {
      const { fakeClient, productUpdate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.delete({ where: { id: "prod-1" } });
      expect(productUpdate).toHaveBeenCalledTimes(1);
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });

  describe("hardDelete", () => {
    it("calls product delete with id", async () => {
      const { fakeClient, productDelete } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.hardDelete("prod-1");
      expect(productDelete).toHaveBeenCalledTimes(1);
      expect(productDelete).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      });
    });
  });

  describe("findManyByShopId", () => {
    it("calls findMany with scope hardening", async () => {
      const { fakeClient, productFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findManyByShopId("shop-1");
      expect(productFindMany).toHaveBeenCalledTimes(1);
      expect(productFindMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", deleted_at: null },
      });
    });

    it("overwrites caller shop_id in where clause", async () => {
      const { fakeClient, productFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findManyByShopId("shop-1", { where: { shop_id: "other" } });
      expect(productFindMany).toHaveBeenCalledTimes(1);
      expect(productFindMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", deleted_at: null },
      });
    });
  });

  describe("count", () => {
    it("delegates directly", async () => {
      const { fakeClient, productCount } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.count({ where: { shop_id: "shop-1" } });
      expect(productCount).toHaveBeenCalledTimes(1);
      expect(productCount).toHaveBeenCalledWith({
        where: { shop_id: "shop-1" },
      });
    });
  });

  describe("findStockWatch", () => {
    it("calls findUnique with compound key", async () => {
      const { fakeClient, stockWatchFindUnique } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.findStockWatch("user-1", "prod-1");
      expect(stockWatchFindUnique).toHaveBeenCalledTimes(1);
      expect(stockWatchFindUnique).toHaveBeenCalledWith({
        where: {
          user_id_product_id: { user_id: "user-1", product_id: "prod-1" },
        },
      });
    });
  });

  describe("createStockWatch", () => {
    it("delegates directly", async () => {
      const { fakeClient, stockWatchCreate } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.createStockWatch("user-1", "prod-1");
      expect(stockWatchCreate).toHaveBeenCalledTimes(1);
      expect(stockWatchCreate).toHaveBeenCalledWith({
        data: { user_id: "user-1", product_id: "prod-1" },
      });
    });
  });

  describe("deleteStockWatch", () => {
    it("delegates directly", async () => {
      const { fakeClient, stockWatchDelete } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.deleteStockWatch("sw-1");
      expect(stockWatchDelete).toHaveBeenCalledTimes(1);
      expect(stockWatchDelete).toHaveBeenCalledWith({
        where: { id: "sw-1" },
      });
    });
  });

  describe("getStockWatches", () => {
    it("applies scope hardening on user_id", async () => {
      const { fakeClient, stockWatchFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.getStockWatches("user-1", {
        include: { product: true },
        where: { user_id: "other" },
      } as unknown as Parameters<typeof repo.getStockWatches>[1]);
      expect(stockWatchFindMany).toHaveBeenCalledTimes(1);
      expect(stockWatchFindMany).toHaveBeenCalledWith({
        include: { product: true },
        where: { user_id: "user-1" },
      });
    });
  });

  describe("getStockWatchersByProductId", () => {
    it("applies scope hardening on product_id", async () => {
      const { fakeClient, stockWatchFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.getStockWatchersByProductId("prod-1", {
        where: { product_id: "other" },
      } as unknown as Parameters<typeof repo.getStockWatchersByProductId>[1]);
      expect(stockWatchFindMany).toHaveBeenCalledTimes(1);
      expect(stockWatchFindMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("deleteStockWatchesByProductId", () => {
    it("delegates directly", async () => {
      const { fakeClient, stockWatchDeleteMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.deleteStockWatchesByProductId("prod-1");
      expect(stockWatchDeleteMany).toHaveBeenCalledTimes(1);
      expect(stockWatchDeleteMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("searchProducts", () => {
    it("trims search term and constructs correct query", async () => {
      const { fakeClient, productFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.searchProducts("  term  ", 5);
      expect(productFindMany).toHaveBeenCalledTimes(1);
      const args = productFindMany.mock.calls[0][0];

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
      const { fakeClient, productFindMany } = buildFakePrismaClient();
      const repo = new ProductRepository(
        fakeClient as unknown as typeof prisma
      );
      await repo.searchProducts("   ");
      expect(productFindMany).toHaveBeenCalledTimes(1);
      const args = productFindMany.mock.calls[0][0];

      expect(args.where.deleted_at).toBeNull();
      expect(args.where.shop).toEqual({ is_active: true, deleted_at: null });
      expect(args.where.OR).toBeUndefined();
    });
  });
});
