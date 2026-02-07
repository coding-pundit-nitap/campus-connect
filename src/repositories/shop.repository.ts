import { Prisma, Shop } from "@/generated/client";
import { prisma } from "@/lib/prisma";

type ShopFindManyOptions = Prisma.ShopFindManyArgs;

export type UpdateShopDto = Prisma.ShopUpdateInput;

type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;

class ShopRepository {
  async findByOwnerId(owner_id: string): Promise<Shop | null>;
  async findByOwnerId<T extends Omit<Prisma.ShopFindFirstArgs, "where">>(
    owner_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<T> | null>;
  async findByOwnerId<T extends Omit<Prisma.ShopFindFirstArgs, "where">>(
    owner_id: string,
    options?: T
  ): Promise<Prisma.ShopGetPayload<T> | Shop | null> {
    const query = {
      where: {
        user: {
          id: owner_id,
        },
        deleted_at: null,
      },
      ...(options ?? {}),
    };
    return prisma.shop.findFirst(query);
  }

  async create(data: Prisma.ShopCreateInput): Promise<Shop> {
    const shop = await prisma.shop.create({ data });
    return shop;
  }

  async update(shop_id: string, data: Prisma.ShopUpdateInput): Promise<Shop> {
    const shop = await prisma.shop.update({ where: { id: shop_id }, data });
    return shop;
  }

  async delete(shop_id: string): Promise<Shop> {
    const shop = await prisma.shop.update({
      where: { id: shop_id },
      data: { deleted_at: new Date(), is_active: false },
    });
    return shop;
  }

  async hardDelete(shop_id: string): Promise<Shop> {
    const shop = await prisma.shop.delete({ where: { id: shop_id } });
    return shop;
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
    const query = {
      where: { id: shop_id, deleted_at: null },
      ...(options ?? {}),
    };
    return prisma.shop.findFirst(query);
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
    const trimmed = searchTerm.trim();

    return prisma.shop.findMany({
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

  async findMany<T extends Prisma.ShopFindManyArgs>(
    option: T
  ): Promise<Prisma.ShopGetPayload<T>[]>;
  async findMany<T extends Prisma.ShopFindManyArgs>(
    options: T
  ): Promise<Shop[]> {
    return prisma.shop.findMany(options);
  }

  async count(where?: Prisma.ShopWhereInput): Promise<number> {
    return prisma.shop.count({ where });
  }
}

export const shopRepository = new ShopRepository();

export default shopRepository;
