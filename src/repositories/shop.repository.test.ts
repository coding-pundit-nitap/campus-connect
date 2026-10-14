import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import { ShopRepository } from "@/repositories/shop.repository";

describe("ShopRepository", () => {
  let prisma: PrismaMock;
  // Separate double for the interactive-transaction client.
  let tx: PrismaMock;
  let repo: ShopRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    tx = createPrismaMock();
    prisma.$transaction.mockImplementation(
      async (fn: (t: PrismaMock) => unknown) => fn(tx)
    );
    tx.shop.delete.mockResolvedValue({ id: "shop-1" });
    repo = new ShopRepository(asPrisma(prisma));
  });

  describe("findById", () => {
    it("scopes by id and deleted_at: null", async () => {
      await repo.findById("shop-1", { include: { products: true } });
      expect(prisma.shop.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({
        include: { products: true },
        where: { id: "shop-1", deleted_at: null },
      });
    });
  });

  describe("findUnique", () => {
    it("calls findUnique directly", async () => {
      await repo.findUnique({ where: { id: "shop-1" } });
      expect(prisma.shop.findUnique).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });
  });

  describe("findMany", () => {
    it("calls findMany directly", async () => {
      await repo.findMany({ take: 10 });
      expect(prisma.shop.findMany).toHaveBeenCalledWith({ take: 10 });
    });
  });

  describe("create", () => {
    it("calls create directly", async () => {
      await repo.create({
        data: { name: "Test Shop" },
      } as Prisma.ShopCreateArgs);
      expect(prisma.shop.create).toHaveBeenCalledWith({
        data: { name: "Test Shop" },
      });
    });
  });

  describe("update", () => {
    it("scopes by id when using id-based overload", async () => {
      await repo.update(
        "shop-1",
        { name: "New Name" },
        { include: { products: true } }
      );
      expect(prisma.shop.update).toHaveBeenCalledWith({
        include: { products: true },
        where: { id: "shop-1" },
        data: { name: "New Name" },
      });
    });

    it("calls update directly when using args-based overload", async () => {
      await repo.update({
        where: { id: "shop-1" },
        data: { name: "New Name" },
      });
      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: "shop-1" },
        data: { name: "New Name" },
      });
    });
  });

  describe("delete", () => {
    it("soft deletes by id when using id-based overload", async () => {
      await repo.delete("shop-1");
      expect(prisma.shop.update).toHaveBeenCalledTimes(1);
      const call = prisma.shop.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: "shop-1" });
      expect(call.data).toMatchObject({ is_active: false });
      expect(call.data.deleted_at).toBeInstanceOf(Date);
    });

    it("soft deletes when using args-based overload", async () => {
      await repo.delete({ where: { id: "shop-1" } });
      expect(prisma.shop.update).toHaveBeenCalledTimes(1);
      const call = prisma.shop.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: "shop-1" });
      expect(call.data).toMatchObject({ is_active: false });
      expect(call.data.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe("hardDelete", () => {
    it("hard deletes by id", async () => {
      await repo.hardDelete("shop-1");
      expect(prisma.shop.delete).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });
  });

  describe("findByOwnerId", () => {
    it("scopes by owner_id and deleted_at: null", async () => {
      await repo.findByOwnerId("user-1", { include: { products: true } });
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({
        include: { products: true },
        where: { user: { id: "user-1" }, deleted_at: null },
      });
    });
  });

  describe("getShops", () => {
    it("calls findMany", async () => {
      await repo.getShops({ take: 10 });
      expect(prisma.shop.findMany).toHaveBeenCalledWith({ take: 10 });
    });
  });

  describe("count", () => {
    it("calls count", async () => {
      await repo.count({ where: { is_active: true } });
      expect(prisma.shop.count).toHaveBeenCalledWith({
        where: { is_active: true },
      });
    });
  });

  describe("searchShops", () => {
    it("constructs correct OR query when search term is provided", async () => {
      await repo.searchShops("test", 20);
      expect(prisma.shop.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          deleted_at: null,
          OR: [
            { name: { contains: "test", mode: "insensitive" } },
            { description: { contains: "test", mode: "insensitive" } },
            { location: { contains: "test", mode: "insensitive" } },
          ],
        },
        take: 20,
      });
    });

    it("does not include OR query when search term is empty", async () => {
      await repo.searchShops("  ", 5);
      expect(prisma.shop.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          deleted_at: null,
          OR: undefined,
        },
        take: 5,
      });
    });
  });

  describe("favorite shops", () => {
    it("findFavoriteShop calls findUnique with compound id", async () => {
      await repo.findFavoriteShop("user-1", "shop-1");
      expect(prisma.favoriteShop.findUnique).toHaveBeenCalledWith({
        where: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } },
      });
    });

    it("addFavoriteShop calls create", async () => {
      await repo.addFavoriteShop("user-1", "shop-1");
      expect(prisma.favoriteShop.create).toHaveBeenCalledWith({
        data: { user_id: "user-1", shop_id: "shop-1" },
      });
    });

    it("removeFavoriteShop calls delete", async () => {
      await repo.removeFavoriteShop("fav-1");
      expect(prisma.favoriteShop.delete).toHaveBeenCalledWith({
        where: { id: "fav-1" },
      });
    });

    it("getFavoriteShops scopes by user_id", async () => {
      await repo.getFavoriteShops("user-1", {
        include: { shop: true },
      } as unknown as Parameters<typeof repo.getFavoriteShops>[1]);
      expect(prisma.favoriteShop.findMany).toHaveBeenCalledWith({
        include: { shop: true },
        where: { user_id: "user-1" },
      });
    });
  });

  describe("deleteShopHard", () => {
    it("deletes shop and unlinks user owner inside transaction", async () => {
      const result = await repo.deleteShopHard("shop-1", "user-1");
      expect(result).toEqual({ id: "shop-1" });
      expect(prisma.shop.delete).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { owned_shop: { disconnect: true } },
      });
      expect(tx.shop.delete).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });

    it("only deletes shop if no user_id is provided", async () => {
      await repo.deleteShopHard("shop-1");
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.shop.delete).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });
  });

  describe("scope hardening", () => {
    it("findById forces id and deleted_at over a caller filter", async () => {
      await repo.findById("shop-1", {
        where: { id: "other", deleted_at: { not: null } },
      } as unknown as Parameters<typeof repo.findById>[1]);
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({
        where: { id: "shop-1", deleted_at: null },
      });
    });

    it("findById without options queries the scope only", async () => {
      prisma.shop.findFirst.mockResolvedValueOnce({ id: "shop-1" });
      await expect(repo.findById("shop-1")).resolves.toEqual({ id: "shop-1" });
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({
        where: { id: "shop-1", deleted_at: null },
      });
    });

    it("findByOwnerId forces owner and deleted_at over a caller filter", async () => {
      await repo.findByOwnerId("user-1", {
        where: { is_active: true, user: { id: "victim" } },
      } as unknown as Parameters<typeof repo.findByOwnerId>[1]);
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({
        where: { is_active: true, user: { id: "user-1" }, deleted_at: null },
      });
    });

    it("findByOwnerId without options queries the scope only", async () => {
      await repo.findByOwnerId("user-1");
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({
        where: { user: { id: "user-1" }, deleted_at: null },
      });
    });

    it("update forces the id and defaults missing data to {}", async () => {
      await repo.update(
        "shop-1",
        undefined as unknown as Prisma.ShopUpdateInput,
        { where: { id: "other" } } as unknown as Parameters<
          typeof repo.update
        >[2]
      );
      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: "shop-1" },
        data: {},
      });
    });

    it("update(id, data) without options targets the id only", async () => {
      await repo.update("shop-1", { name: "N" });
      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: "shop-1" },
        data: { name: "N" },
      });
    });

    it("getFavoriteShops without options queries by user only", async () => {
      await repo.getFavoriteShops("user-1");
      expect(prisma.favoriteShop.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
      });
    });

    it("getShops without options passes undefined", async () => {
      await repo.getShops();
      expect(prisma.shop.findMany).toHaveBeenCalledWith(undefined);
    });

    it("searchShops defaults to 10 results", async () => {
      await repo.searchShops("x");
      expect(prisma.shop.findMany.mock.calls[0][0].take).toBe(10);
    });
  });
});
