import { Prisma, Product } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateProductDto = Prisma.ProductCreateInput;

export type UpdateProductDto = Prisma.ProductUpdateInput;

type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;

type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;

type ProductCreateOptions = Omit<Prisma.ProductCreateArgs, "data">;

type ProductUpdateOptions = Omit<Prisma.ProductUpdateArgs, "where" | "data">;

type ProductDeleteOptions = Omit<Prisma.ProductDeleteArgs, "where">;

class ProductRepository {
  async findById(product_id: string): Promise<Product | null>;
  async findById<T extends ProductFindOptions>(
    product_id: string,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T> | null>;
  async findById<T extends ProductFindOptions>(
    product_id: string,
    options?: T
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product | null
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.findUnique(query);
  }

  async findManyByShopId(shop_id: string): Promise<Product[]>;
  async findManyByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[]>;
  async findManyByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options?: T
  ): Promise<
    Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[] | Product[]
  > {
    const query = { where: { shop_id: shop_id }, ...(options ?? {}) };
    return prisma.product.findMany(query);
  }

  async create(data: CreateProductDto): Promise<Product>;
  async create<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ data: CreateProductDto } & T>>;
  async create<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options?: T
  ): Promise<
    Prisma.ProductGetPayload<{ data: CreateProductDto } & T> | Product
  > {
    const query = { data, ...(options ?? {}) };
    return prisma.product.create(query);
  }

  async update(product_id: string, data: UpdateProductDto): Promise<Product>;
  async update<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options: T
  ): Promise<
    Prisma.ProductGetPayload<
      { where: { id: string }; data: UpdateProductDto } & T
    >
  >;
  async update<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options?: T
  ): Promise<
    | Prisma.ProductGetPayload<
        { where: { id: string }; data: UpdateProductDto } & T
      >
    | Product
  > {
    const query = { where: { id: product_id }, data, ...(options ?? {}) };
    return prisma.product.update(query);
  }

  async delete(product_id: string): Promise<Product>;
  async delete<T extends ProductDeleteOptions>(
    product_id: string,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T>>;
  async delete<T extends ProductDeleteOptions>(
    product_id: string,
    options?: T
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.delete(query);
  }
}

export const productRepository = new ProductRepository();

export default productRepository;
