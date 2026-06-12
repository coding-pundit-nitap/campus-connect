import { Prisma, Shop } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export class ShopRepository extends BaseRepository<
  Shop,
  Prisma.ShopFindUniqueArgs,
  Prisma.ShopFindManyArgs,
  Prisma.ShopCreateArgs,
  Prisma.ShopUpdateArgs,
  Prisma.ShopDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.shop);
  }

  async findById(id: string): Promise<Shop | null>;
  async findById<T extends Omit<Prisma.ShopFindFirstArgs, "where">>(
    id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.ShopDelegate,
    T & { where: { id: string; deleted_at: null } },
    "findFirst"
  > | null>;
  async findById(
    id: string,
    options?: Omit<Prisma.ShopFindFirstArgs, "where">
  ): Promise<
    | Shop
    | null
    | Prisma.Result<
        Prisma.ShopDelegate,
        Omit<Prisma.ShopFindFirstArgs, "where"> & {
          where: { id: string; deleted_at: null };
        },
        "findFirst"
      >
  > {
    return this.prismaClient.shop.findFirst({
      where: { id, deleted_at: null },
      ...options,
    });
  }

  async findUnique<T extends Prisma.ShopFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ShopDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.ShopFindUniqueArgs
  ): Promise<Shop | null>;
  override async findUnique(
    args: Prisma.ShopFindUniqueArgs
  ): Promise<
    | Shop
    | null
    | Prisma.Result<
        Prisma.ShopDelegate,
        Prisma.ShopFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.shop.findUnique(args);
  }

  async findMany<T extends Prisma.ShopFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.ShopDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.ShopFindManyArgs): Promise<Shop[]>;
  override async findMany(
    args?: Prisma.ShopFindManyArgs
  ): Promise<
    | Shop[]
    | Prisma.Result<Prisma.ShopDelegate, Prisma.ShopFindManyArgs, "findMany">
  > {
    return this.prismaClient.shop.findMany(args);
  }

  async create<T extends Prisma.ShopCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ShopDelegate, T, "create">>;
  override async create(args: Prisma.ShopCreateArgs): Promise<Shop>;
  override async create(
    args: Prisma.ShopCreateArgs
  ): Promise<
    Shop | Prisma.Result<Prisma.ShopDelegate, Prisma.ShopCreateArgs, "create">
  > {
    return this.prismaClient.shop.create(args);
  }

  async update<T extends Prisma.ShopUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ShopDelegate, T, "update">>;
  override async update(args: Prisma.ShopUpdateArgs): Promise<Shop>;
  async update<T extends Omit<Prisma.ShopUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.ShopUpdateInput,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.ShopDelegate,
      T & { where: { id: string }; data: Prisma.ShopUpdateInput },
      "update"
    >
  >;
  override async update(
    idOrArgs: string | Prisma.ShopUpdateArgs,
    data?: Prisma.ShopUpdateInput,
    options?: Omit<Prisma.ShopUpdateArgs, "where" | "data">
  ): Promise<
    Shop | Prisma.Result<Prisma.ShopDelegate, Prisma.ShopUpdateArgs, "update">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.shop.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.shop.update(idOrArgs);
  }

  async delete<T extends Prisma.ShopDeleteArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ShopDelegate, T, "delete">>;
  override async delete(args: Prisma.ShopDeleteArgs): Promise<Shop>;
  async delete(id: string): Promise<Shop>;
  override async delete(
    idOrArgs: string | Prisma.ShopDeleteArgs
  ): Promise<
    Shop | Prisma.Result<Prisma.ShopDelegate, Prisma.ShopDeleteArgs, "delete">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.shop.update({
        where: { id: idOrArgs },
        data: { deleted_at: new Date(), is_active: false },
      });
    }
    return this.prismaClient.shop.update({
      where: idOrArgs.where,
      data: { deleted_at: new Date(), is_active: false },
    });
  }

  async hardDelete(shop_id: string): Promise<Shop> {
    return this.prismaClient.shop.delete({ where: { id: shop_id } });
  }

  async findByOwnerId(owner_id: string): Promise<Shop | null>;
  async findByOwnerId<T extends Omit<Prisma.ShopFindFirstArgs, "where">>(
    owner_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.ShopDelegate,
    T & { where: { user: { id: string }; deleted_at: null } },
    "findFirst"
  > | null>;
  async findByOwnerId(
    owner_id: string,
    options?: Omit<Prisma.ShopFindFirstArgs, "where">
  ): Promise<
    | Shop
    | null
    | Prisma.Result<
        Prisma.ShopDelegate,
        Omit<Prisma.ShopFindFirstArgs, "where"> & {
          where: { user: { id: string }; deleted_at: null };
        },
        "findFirst"
      >
  > {
    return this.prismaClient.shop.findFirst({
      where: {
        user: {
          id: owner_id,
        },
        deleted_at: null,
      },
      ...options,
    });
  }

  async getShops(): Promise<Shop[]>;
  async getShops<T extends Prisma.ShopFindManyArgs>(
    options: T
  ): Promise<Prisma.Result<Prisma.ShopDelegate, T, "findMany">>;
  async getShops<T extends Prisma.ShopFindManyArgs>(
    options?: T
  ): Promise<Shop[] | Prisma.Result<Prisma.ShopDelegate, T, "findMany">> {
    return this.prismaClient.shop.findMany(options);
  }

  async count(args?: Prisma.ShopCountArgs): Promise<number> {
    return this.prismaClient.shop.count(args);
  }

  async searchShops(searchTerm: string, limit: number = 10): Promise<Shop[]> {
    const trimmed = searchTerm.trim();

    return this.prismaClient.shop.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        OR: trimmed
          ? [
              { name: { contains: trimmed, mode: "insensitive" } },
              { description: { contains: trimmed, mode: "insensitive" } },
              { location: { contains: trimmed, mode: "insensitive" } },
            ]
          : undefined,
      },
      take: limit,
    });
  }

  async findFavoriteShop(user_id: string, shop_id: string) {
    return this.prismaClient.favoriteShop.findUnique({
      where: { user_id_shop_id: { user_id, shop_id } },
    });
  }

  async addFavoriteShop(user_id: string, shop_id: string) {
    return this.prismaClient.favoriteShop.create({
      data: { user_id, shop_id },
    });
  }

  async removeFavoriteShop(id: string) {
    return this.prismaClient.favoriteShop.delete({ where: { id } });
  }

  async getFavoriteShops(
    user_id: string,
    options?: Omit<Prisma.FavoriteShopFindManyArgs, "where">
  ) {
    return this.prismaClient.favoriteShop.findMany({
      where: { user_id },
      ...options,
    });
  }

  async deleteShopHard(shop_id: string, user_id?: string) {
    return this.prismaClient.$transaction(async (tx) => {
      if (user_id) {
        await tx.user.update({
          where: { id: user_id },
          data: { owned_shop: { disconnect: true } },
        });
      }
      return tx.shop.delete({ where: { id: shop_id } });
    });
  }
}

export const shopRepository = new ShopRepository();
export default shopRepository;
