import { Prisma, Shop } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ShopFormData } from "@/validations/shop";

type ShopFindManyOptions = Prisma.ShopFindManyArgs;

export type UpdateShopDto = Prisma.ShopUpdateInput;

type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;

type ShopCreateOptions = Omit<Prisma.ShopCreateArgs, "data">;

type ShopUpdateOptions = Omit<Prisma.ShopUpdateArgs, "where" | "data">;

type ShopDeleteOptions = Omit<Prisma.ShopDeleteArgs, "where">;

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

  async create(owner_id: string, data: ShopFormData): Promise<Shop>;
  async create<T extends ShopCreateOptions>(
    owner_id: string,
    data: ShopFormData,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ data: ShopFormData } & T>>;
  async create<T extends ShopCreateOptions>(
    owner_id: string,
    data: ShopFormData,
    options?: T
  ): Promise<Prisma.ShopGetPayload<{ data: ShopFormData } & T> | Shop> {
    const query = {
      data: {
        ...data,
        owner: { connect: { id: owner_id } },
      },
      ...(options ?? {}),
    };
    return prisma.shop.create(query);
  }

  async update(shop_id: string, data: ShopFormData): Promise<Shop>;
  async update<T extends ShopUpdateOptions>(
    shop_id: string,
    data: ShopFormData,
    options: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string }; data: ShopFormData } & T>
  >;
  async update<T extends ShopUpdateOptions>(
    shop_id: string,
    data: ShopFormData,
    options?: T
  ): Promise<
    | Prisma.ShopGetPayload<{ where: { id: string }; data: ShopFormData } & T>
    | Shop
  > {
    const query = { where: { id: shop_id }, data, ...(options ?? {}) };
    return prisma.shop.update(query);
  }

  async delete(shop_id: string): Promise<Shop>;
  async delete<T extends ShopDeleteOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T>>;
  async delete<T extends ShopDeleteOptions>(
    shop_id: string,
    options?: T
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T> | Shop> {
    const query = { where: { id: shop_id }, ...(options ?? {}) };
    return prisma.shop.delete(query);
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
}

export const shopRepository = new ShopRepository();

export default shopRepository;
