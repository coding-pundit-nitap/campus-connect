import { Prisma, Product } from "@prisma/client";

import { prisma } from "@/lib/prisma";

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
    const query = { where: { id: product_id }, ...(data ?? {}) };
    return prisma.product.findUnique(query);
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
    return prisma.product.findMany({ where: { shop_id }, ...data });
  }

  async create(data: CreateProductDto) {
    return prisma.product.create({
      data,
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
  }

  async update(product_id: string, data: UpdateProductDto) {
    return prisma.product.update({
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
  }

  async delete(
    product_id: string,
    data?: Omit<Prisma.ProductDeleteArgs, "where">
  ): Promise<Product> {
    return prisma.product.delete({ where: { id: product_id }, ...data });
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

export const productRepository = new ProductRepository();

export default productRepository;
