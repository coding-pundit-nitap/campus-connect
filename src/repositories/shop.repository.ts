import { Prisma, Shop } from "@prisma/client";

import { elasticClient, INDICES } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { searchQueue } from "@/lib/search/search-producer";

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

    await searchQueue.add("index-shop", {
      type: "INDEX_SHOP",
      payload: {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        location: shop.location,
        is_active: shop.is_active,
      },
    });

    return shop;
  }

  async update(shop_id: string, data: Prisma.ShopUpdateInput): Promise<Shop> {
    const shop = await prisma.shop.update({ where: { id: shop_id }, data });

    await searchQueue.add("update-shop", {
      type: "INDEX_SHOP",
      payload: {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        location: shop.location,
        is_active: shop.is_active,
        image_key: shop.image_key,
      },
    });

    return shop;
  }

  /**
   * Soft delete - sets deleted_at timestamp instead of actually deleting.
   * Shop data is preserved for historical purposes.
   */
  async delete(shop_id: string): Promise<Shop> {
    const shop = await prisma.shop.update({
      where: { id: shop_id },
      data: { deleted_at: new Date(), is_active: false },
    });

    // Remove from search index
    await searchQueue.add("delete-shop", {
      type: "DELETE_SHOP",
      payload: {
        id: shop_id,
      },
    });

    return shop;
  }

  /**
   * Hard delete - permanently removes the shop from the database.
   * Use only for cleanup/maintenance purposes.
   */
  async hardDelete(shop_id: string): Promise<Shop> {
    const shop = await prisma.shop.delete({ where: { id: shop_id } });

    await searchQueue.add("delete-shop", {
      type: "DELETE_SHOP",
      payload: {
        id: shop_id,
      },
    });

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
    try {
      const result = await elasticClient.search<Shop>({
        index: INDICES.SHOPS,
        size: limit,
        // Only fetch document IDs from Elasticsearch, then retrieve full data from PostgreSQL
        // This ensures data consistency and allows us to use Prisma for data access
        _source: false,
        query: {
          bool: {
            must: [
              { term: { is_active: true } },
              {
                multi_match: {
                  query: searchTerm,
                  fields: ["name^3", "description", "location"],
                  fuzziness: "AUTO",
                },
              },
            ],
          },
        },
      });
      const hits = result.hits.hits;
      if (hits.length === 0) return [];

      const ids = hits.map((h) => h._id || "");

      const shops = await prisma.shop.findMany({
        where: { id: { in: ids }, is_active: true, deleted_at: null },
      });

      const shopMap = new Map(shops.map((s) => [s.id, s]));

      return hits
        .map((hit) => shopMap.get(hit._id || ""))
        .filter((s): s is Shop => s !== undefined);
    } catch (error) {
      console.error("Elasticsearch failed, falling back to database", error);
      return prisma.shop.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
          ],
          is_active: true,
          deleted_at: null,
        },
        take: limit,
      });
    }
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

export default shopReShopRepository;
