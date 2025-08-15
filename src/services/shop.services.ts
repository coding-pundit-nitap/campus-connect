import { prisma } from "@/lib/prisma";
import { Prisma, Shop } from "@prisma/client";

export type CreateShopDto = Prisma.ShopCreateInput;
export type UpdateShopDto = Prisma.ShopUpdateInput;

type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;
type ShopCreateOptions = Omit<Prisma.ShopCreateArgs, "data">;
type ShopUpdateOptions = Omit<Prisma.ShopUpdateArgs, "where" | "data">;
type ShopDeleteOptions = Omit<Prisma.ShopDeleteArgs, "where">;

class ShopServices {
  async getShopByOwnerId(ownerId: string): Promise<Shop | null>;
  async getShopByOwnerId<T extends ShopFindOptions>(
    ownerId: string,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | null>;
  async getShopByOwnerId<T extends ShopFindOptions>(
    ownerId: string,
    options?: T,
  ): Promise<
    Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | Shop | null
  > {
    const query = { where: { owner_id: ownerId }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }

  async createShop(data: CreateShopDto): Promise<Shop>;
  async createShop<T extends ShopCreateOptions>(
    data: CreateShopDto,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ data: CreateShopDto } & T>>;
  async createShop<T extends ShopCreateOptions>(
    data: CreateShopDto,
    options?: T,
  ): Promise<Prisma.ShopGetPayload<{ data: CreateShopDto } & T> | Shop> {
    const query = { data, ...(options ?? {}) };
    return prisma.shop.create(query);
  }

  async updateShop(shopId: string, data: UpdateShopDto): Promise<Shop>;
  async updateShop<T extends ShopUpdateOptions>(
    shopId: string,
    data: UpdateShopDto,
    options: T,
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string }; data: UpdateShopDto } & T>
  >;
  async updateShop<T extends ShopUpdateOptions>(
    shopId: string,
    data: UpdateShopDto,
    options?: T,
  ): Promise<
    | Prisma.ShopGetPayload<{ where: { id: string }; data: UpdateShopDto } & T>
    | Shop
  > {
    const query = { where: { id: shopId }, data, ...(options ?? {}) };
    return prisma.shop.update(query);
  }

  async deleteShop(shopId: string): Promise<Shop>;
  async deleteShop<T extends ShopDeleteOptions>(
    shopId: string,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T>>;
  async deleteShop<T extends ShopDeleteOptions>(
    shopId: string,
    options?: T,
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T> | Shop> {
    const query = { where: { id: shopId }, ...(options ?? {}) };
    return prisma.shop.delete(query);
  }
}

const shopServices = new ShopServices();

export default shopServices;
