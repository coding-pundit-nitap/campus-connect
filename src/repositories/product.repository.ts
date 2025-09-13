import { Prisma, Product } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateProductDto = Prisma.ProductCreateInput;

export type UpdateProductDto = Omit<Prisma.ProductUpdateArgs, "where">;

type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;

type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;

class ProductRepository {
  async findById(
    product_id: string,
    data?: ProductFindOptions
  ): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id: product_id }, ...data });
  }

  async findManyByShopId(
    shop_id: string,
    data?: ProductFindManyOptions
  ): Promise<Product[]> {
    return prisma.product.findMany({ where: { shop_id }, ...data });
  }

  async create(data: CreateProductDto): Promise<Product> {
    return prisma.product.create({ data });
  }

  async update(product_id: string, data: UpdateProductDto): Promise<Product> {
    return prisma.product.update({ where: { id: product_id }, ...data });
  }

  async delete(
    product_id: string,
    data?: Omit<Prisma.ProductDeleteArgs, "where">
  ): Promise<Product> {
    return prisma.product.delete({ where: { id: product_id }, ...data });
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
