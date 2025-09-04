import { Prisma, Product } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateProductDto = Prisma.ProductCreateInput;

export type UpdateProductDto = Prisma.ProductUpdateInput;

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
    return prisma.product.update({ where: { id: product_id }, data });
  }

  async delete(
    product_id: string,
    data?: Omit<Prisma.ProductDeleteArgs, "where">
  ): Promise<Product> {
    return prisma.product.delete({ where: { id: product_id }, ...data });
  }
}

export const productRepository = new ProductRepository();

export default productRepository;
