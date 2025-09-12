import { Prisma, Shop } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ShopFindManyOptions = Prisma.ShopFindManyArgs;

export type UpdateShopDto = Prisma.ShopUpdateInput;

type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;

class ShopRepository {
  async findByOwnerId(owner_id: string): Promise<Shop | null>;
  async findByOwnerId<T extends ShopFindOptions>(
    owner_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | null>;
  async findByOwnerId<T extends ShopFindOptions>(
    owner_id: string,
    options?: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | Shop | null
  > {
    const query = { where: { owner_id }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }

  async create(data: Prisma.ShopCreateInput): Promise<Shop> {
    return prisma.shop.create({ data });
  }

  async update(shop_id: string, data: Prisma.ShopUpdateInput): Promise<Shop> {
    return prisma.shop.update({ where: { id: shop_id }, data });
  }

  async delete(shop_id: string): Promise<Shop> {
    return prisma.shop.delete({ where: { id: shop_id } });
  }

  async findById(shop_id: string): Promise<Shop | null>;
  async findById<T extends ShopFindOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T> | null>;
  async findById<T extends ShopFindOptions>(
    shop_id: string,
    options?: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string } } & T> | Shop | null
  > {
    const query = { where: { id: shop_id }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }

  async getShops(): Promise<Shop[]>;
  async getShops<T extends ShopFindManyOptions>(
    options: T
  ): Promise<Prisma.ShopGetPayload<T>[]>;
  async getShops<T extends ShopFindManyOptions>(
    options?: T
  ): Promise<Prisma.ShopGetPayload<T>[] | Shop[]> {
    const query = { ...(options ?? {}) };
    return prisma.shop.findMany(query);
  }

  async searchShops(searchTerm: string, limit: number = 10): Promise<Shop[]> {
    return prisma.shop.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            location: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    });
  }
}

export const shopRepository = new ShopRepository();

export default shopReShopRepository;
