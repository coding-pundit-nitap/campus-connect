import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import type { prisma } from "@/lib/prisma";
import { ShopRepository } from "@/repositories/shop.repository";

function buildFakePrismaClient() {
  const shopFindUnique = vi.fn().mockResolvedValue({ id: "shop-1" });
  const shopFindFirst = vi.fn().mockResolvedValue({ id: "shop-1" });
  const shopFindMany = vi.fn().mockResolvedValue([{ id: "shop-1" }]);
  const shopCreate = vi.fn().mockResolvedValue({ id: "shop-1" });
  const shopUpdate = vi.fn().mockResolvedValue({ id: "shop-1" });
  const shopDelete = vi.fn().mockResolvedValue({ id: "shop-1" });
  const shopCount = vi.fn().mockResolvedValue(1);

  const favFindUnique = vi.fn().mockResolvedValue({ id: "fav-1" });
  const favFindMany = vi.fn().mockResolvedValue([{ id: "fav-1" }]);
  const favCreate = vi.fn().mockResolvedValue({ id: "fav-1" });
  const favDelete = vi.fn().mockResolvedValue({ id: "fav-1" });

  const userUpdate = vi.fn().mockResolvedValue({ id: "user-1" });

  const txShopDelete = vi.fn().mockResolvedValue({ id: "shop-1" });
  const txUserUpdate = vi.fn().mockResolvedValue({ id: "user-1" });

  type FakeTx = {
    shop: { delete: typeof txShopDelete };
    user: { update: typeof txUserUpdate };
  };

  const tx: FakeTx = {
    shop: { delete: txShopDelete },
    user: { update: txUserUpdate },
  };

  const transaction = vi.fn(async (callback: (tx: FakeTx) => unknown) =>
    callback(tx)
  );

  const fakeClient = {
    shop: {
      findUnique: shopFindUnique,
      findFirst: shopFindFirst,
      findMany: shopFindMany,
      create: shopCreate,
      update: shopUpdate,
      delete: shopDelete,
      count: shopCount,
    },
    favoriteShop: {
      findUnique: favFindUnique,
      findMany: favFindMany,
      create: favCreate,
      delete: favDelete,
    },
    user: {
      update: userUpdate,
    },
    $transaction: transaction,
  };

  return {
    fakeClient,
    shopFindUnique,
    shopFindFirst,
    shopFindMany,
    shopCreate,
    shopUpdate,
    shopDelete,
    shopCount,
    favFindUnique,
    favFindMany,
    favCreate,
    favDelete,
    userUpdate,
    transaction,
    txShopDelete,
    txUserUpdate,
  };
}

describe("ShopRepository", () => {
  let fakes: ReturnType<typeof buildFakePrismaClient>;
  let repo: ShopRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    fakes = buildFakePrismaClient();
    repo = new ShopRepository(fakes.fakeClient as unknown as typeof prisma);
  });

  describe("findById", () => {
    it("scopes by id and deleted_at: null", async () => {
      await repo.findById("shop-1", { include: { products: true } });
      expect(fakes.shopFindFirst).toHaveBeenCalledTimes(1);
      expect(fakes.shopFindFirst).toHaveBeenCalledWith({
        include: { products: true },
        where: { id: "shop-1", deleted_at: null },
      });
    });
  });

  describe("findUnique", () => {
    it("calls findUnique directly", async () => {
      await repo.findUnique({ where: { id: "shop-1" } });
      expect(fakes.shopFindUnique).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });
  });

  describe("findMany", () => {
    it("calls findMany directly", async () => {
      await repo.findMany({ take: 10 });
      expect(fakes.shopFindMany).toHaveBeenCalledWith({ take: 10 });
    });
  });

  describe("create", () => {
    it("calls create directly", async () => {
      await repo.create({
        data: { name: "Test Shop" },
      } as Prisma.ShopCreateArgs);
      expect(fakes.shopCreate).toHaveBeenCalledWith({
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
      expect(fakes.shopUpdate).toHaveBeenCalledWith({
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
      expect(fakes.shopUpdate).toHaveBeenCalledWith({
        where: { id: "shop-1" },
        data: { name: "New Name" },
      });
    });
  });

  describe("delete", () => {
    it("soft deletes by id when using id-based overload", async () => {
      await repo.delete("shop-1");
      expect(fakes.shopUpdate).toHaveBeenCalledTimes(1);
      const call = fakes.shopUpdate.mock.calls[0][0];
      expect(call.where).toEqual({ id: "shop-1" });
      expect(call.data).toMatchObject({ is_active: false });
      expect(call.data.deleted_at).toBeInstanceOf(Date);
    });

    it("soft deletes when using args-based overload", async () => {
      await repo.delete({ where: { id: "shop-1" } });
      expect(fakes.shopUpdate).toHaveBeenCalledTimes(1);
      const call = fakes.shopUpdate.mock.calls[0][0];
      expect(call.where).toEqual({ id: "shop-1" });
      expect(call.data).toMatchObject({ is_active: false });
      expect(call.data.deleted_at).toBeInstanceOf(Date);
    });
  });

  describe("hardDelete", () => {
    it("hard deletes by id", async () => {
      await repo.hardDelete("shop-1");
      expect(fakes.shopDelete).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });
  });

  describe("findByOwnerId", () => {
    it("scopes by owner_id and deleted_at: null", async () => {
      await repo.findByOwnerId("user-1", { include: { products: true } });
      expect(fakes.shopFindFirst).toHaveBeenCalledWith({
        include: { products: true },
        where: { user: { id: "user-1" }, deleted_at: null },
      });
    });
  });

  describe("getShops", () => {
    it("calls findMany", async () => {
      await repo.getShops({ take: 10 });
      expect(fakes.shopFindMany).toHaveBeenCalledWith({ take: 10 });
    });
  });

  describe("count", () => {
    it("calls count", async () => {
      await repo.count({ where: { is_active: true } });
      expect(fakes.shopCount).toHaveBeenCalledWith({
        where: { is_active: true },
      });
    });
  });

  describe("searchShops", () => {
    it("constructs correct OR query when search term is provided", async () => {
      await repo.searchShops("test", 20);
      expect(fakes.shopFindMany).toHaveBeenCalledWith({
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
      expect(fakes.shopFindMany).toHaveBeenCalledWith({
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
      expect(fakes.favFindUnique).toHaveBeenCalledWith({
        where: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } },
      });
    });

    it("addFavoriteShop calls create", async () => {
      await repo.addFavoriteShop("user-1", "shop-1");
      expect(fakes.favCreate).toHaveBeenCalledWith({
        data: { user_id: "user-1", shop_id: "shop-1" },
      });
    });

    it("removeFavoriteShop calls delete", async () => {
      await repo.removeFavoriteShop("fav-1");
      expect(fakes.favDelete).toHaveBeenCalledWith({
        where: { id: "fav-1" },
      });
    });

    it("getFavoriteShops scopes by user_id", async () => {
      await repo.getFavoriteShops("user-1", {
        include: { shop: true },
      } as unknown as Parameters<typeof repo.getFavoriteShops>[1]);
      expect(fakes.favFindMany).toHaveBeenCalledWith({
        include: { shop: true },
        where: { user_id: "user-1" },
      });
    });
  });

  describe("deleteShopHard", () => {
    it("deletes shop and unlinks user owner inside transaction", async () => {
      await repo.deleteShopHard("shop-1", "user-1");
      expect(fakes.transaction).toHaveBeenCalledTimes(1);
      expect(fakes.txUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { owned_shop: { disconnect: true } },
      });
      expect(fakes.txShopDelete).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });

    it("only deletes shop if no user_id is provided", async () => {
      await repo.deleteShopHard("shop-1");
      expect(fakes.transaction).toHaveBeenCalledTimes(1);
      expect(fakes.txUserUpdate).not.toHaveBeenCalled();
      expect(fakes.txShopDelete).toHaveBeenCalledWith({
        where: { id: "shop-1" },
      });
    });
  });
});
