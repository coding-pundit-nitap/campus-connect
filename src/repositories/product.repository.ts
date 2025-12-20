import { Prisma, Product } from "@/../prisma/generated/client";
import { elasticClient, INDICES } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { searchQueue } from "@/lib/search/search-producer";

export type CreateProductDto = Prisma.ProductCreateInput;

export type UpdateProductDto = Omit<Prisma.ProductUpdateArgs, "where">;

type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;

type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;

class ProductRepository {
  async findById(product_id: string): Promise<Product | null>;
  async findById<T extends ProductFindOptions>(
    shop_id: string,
    data: T
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T> | null>;
  async findById<T extends ProductFindOptions>(
    product_id: string,
    data?: T
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product | null
  > {
    const query = {
      where: { id: product_id, deleted_at: null },
      ...(data ?? {}),
    };
    return prisma.product.findFirst(query);
  }

  async findManyByShopId(shop_id: string): Promise<Product[]>;
  async findManyByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    data: T
  ): Promise<Prisma.ProductGetPayload<T>[]>;
  async findManyByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    data?: T
  ): Promise<Prisma.ProductGetPayload<T>[] | Product[]> {
    return prisma.product.findMany({
      where: { shop_id, deleted_at: null },
      ...data,
    });
  }

  async create(data: CreateProductDto) {
    const product = await prisma.product.create({
      data,
      include: { category: true, shop: { select: { id: true, name: true } } },
    });

    await searchQueue.add("index-product", {
      type: "INDEX_PRODUCT",
      payload: {
        id: product.id,
        name: product.name,
        description: product.description,
        shop_id: product.shop_id,
        shop_name: product.shop.name,
        category_name: product.category?.name,
        price: product.price,
        image_key: product.image_key,
      },
    });

    return product;
  }

  async update(product_id: string, data: UpdateProductDto) {
    const product = await prisma.product.update({
      where: { id: product_id },
      ...data,
      include: {
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    await searchQueue
      .add("update-product", {
        type: "INDEX_PRODUCT",
        payload: {
          id: product.id,
          name: product.name,
          description: product.description,
          shop_id: product.shop_id,
          shop_name: product.shop.name,
          category_name: product.category?.name,
          price: product.price,
          image_key: product.image_key,
        },
      })
      .catch((err) => console.error("ES Update Error", err));

    return product;
  }
  async delete(product_id: string): Promise<Product> {
    const product = await prisma.product.update({
      where: { id: product_id },
      data: { deleted_at: new Date() },
    });

    await searchQueue.add("delete-product", {
      type: "DELETE_PRODUCT",
      payload: {
        id: product_id,
      },
    });

    return product;
  }
  async hardDelete(
    product_id: string,
    data?: Omit<Prisma.ProductDeleteArgs, "where">
  ): Promise<Product> {
    const product = await prisma.product.delete({
      where: { id: product_id },
      ...data,
    });

    await searchQueue.add("delete-product", {
      type: "DELETE_PRODUCT",
      payload: {
        id: product_id,
      },
    });

    return product;
  }

  async findMany(): Promise<Product[]>;
  async findMany<T extends ProductFindManyOptions>(
    data: T
  ): Promise<Prisma.ProductGetPayload<T>[]>;
  async findMany<T extends ProductFindManyOptions>(
    data?: T
  ): Promise<Prisma.ProductGetPayload<T>[] | Product[]> {
    return prisma.product.findMany({ ...data });
  }

  async searchProducts(
    searchTerm: string,
    limit: number = 10
  ): Promise<
    (Product & {
      shop: {
        id: string;
        name: string;
      };
    })[]
  > {
    try {
      const result = await elasticClient.search<
        Product & { shop: { id: string; name: string } }
      >({
        index: INDICES.PRODUCTS,
        size: limit,
        _source: false,
        query: {
          multi_match: {
            query: searchTerm,
            fields: ["name^3", "description", "shop_name^2", "category_name"],
            fuzziness: "AUTO",
          },
        },
      });
      const hits = result.hits.hits;
      if (hits.length === 0) return [];

      const ids = hits.map((h) => h._id || "");

      const products = await prisma.product.findMany({
        where: {
          id: { in: ids },
          shop: { is_active: true, deleted_at: null },
          deleted_at: null,
        },
        include: {
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      return hits
        .map((hit) => productMap.get(hit._id || ""))
        .filter(
          (p): p is Product & { shop: { id: string; name: string } } =>
            p !== undefined
        );
    } catch (error) {
      console.error("ES Search Error", error);
      return prisma.product.findMany({
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
          ],
          shop: {
            is_active: true,
          },
        },
        include: {
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: limit,
      });
    }
  }
}

export const productRepository = new ProductRepository();

export default productRepository;
