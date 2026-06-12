import { Prisma, Shop } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

type ShopFindManyOptions = Prisma.ShopFindManyArgs;
type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;

export class ShopRepository extends BaseRepository<Shop, Prisma.ShopDelegate> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.shop);
  }

  override async findById<
    T extends Omit<Parameters<Prisma.ShopDelegate["findUnique"]>[0], "where">,
  >(
    id: string,
    options?: T
  ): Promise<Prisma.Result<
    Prisma.ShopDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null> {
    return this.prismaClient.shop.findFirst({
      where: { id, deleted_at: null },
      ...options,
    } as any) as any;
  }

  override async delete<
    T extends Omit<Parameters<Prisma.ShopDelegate["delete"]>[0], "where">,
  >(
    id: string,
    options?: T
  ): Promise<
    Prisma.Result<Prisma.ShopDelegate, T & { where: { id: string } }, "delete">
  > {
    return this.prismaClient.shop.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
      ...options,
    } as any) as any;
  }

  async hardDelete(shop_id: string): Promise<Shop> {
    return this.prismaClient.shop.delete({ where: { id: shop_id } });
  }

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
    return this.prismaClient.shop.findFirst(query);
  }

  async getShops(): Promise<Shop[]>;
  async getShops<T extends ShopFindManyOptions>(
    options: T
  ): Promise<Prisma.ShopGetPayload<T>[]>;
  async getShops<T extends ShopFindManyOptions>(
    options?: T
  ): Promise<Prisma.ShopGetPayload<T>[] | Shop[]> {
    const query = { ...(options ?? {}) };
    return this.prismaClient.shop.findMany(query);
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
}

export const shopRepository = new ShopRepository();
export default shopRepository;
