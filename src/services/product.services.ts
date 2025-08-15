import { Prisma, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateProductDto = Prisma.ProductCreateInput;
export type UpdateProductDto = Prisma.ProductUpdateInput;

type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;
type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;
type ProductCreateOptions = Omit<Prisma.ProductCreateArgs, "data">;
type ProductUpdateOptions = Omit<Prisma.ProductUpdateArgs, "where" | "data">;
type ProductDeleteOptions = Omit<Prisma.ProductDeleteArgs, "where">;

class ProductServices {
  async getProductById(product_id: string): Promise<Product | null>;
  async getProductById<T extends ProductFindOptions>(
    product_id: string,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T> | null>;
  async getProductById<T extends ProductFindOptions>(
    product_id: string,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product | null
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.findUnique(query);
  }

  async getProductsByShopId(shop_id: string): Promise<Product[]>;
  async getProductsByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[]>;
  async getProductsByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[] | Product[]
  > {
    const query = { where: { shop_id: shop_id }, ...(options ?? {}) };
    return prisma.product.findMany(query);
  }

  async createProduct(data: CreateProductDto): Promise<Product>;
  async createProduct<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ data: CreateProductDto } & T>>;
  async createProduct<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ data: CreateProductDto } & T> | Product
  > {
    const query = { data, ...(options ?? {}) };
    return prisma.product.create(query);
  }

  async updateProduct(
    product_id: string,
    data: UpdateProductDto,
  ): Promise<Product>;
  async updateProduct<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options: T,
  ): Promise<
    Prisma.ProductGetPayload<
      { where: { id: string }; data: UpdateProductDto } & T
    >
  >;
  async updateProduct<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options?: T,
  ): Promise<
    | Prisma.ProductGetPayload<
        { where: { id: string }; data: UpdateProductDto } & T
      >
    | Product
  > {
    const query = { where: { id: product_id }, data, ...(options ?? {}) };
    return prisma.product.update(query);
  }

  async deleteProduct(product_id: string): Promise<Product>;
  async deleteProduct<T extends ProductDeleteOptions>(
    product_id: string,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T>>;
  async deleteProduct<T extends ProductDeleteOptions>(
    product_id: string,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.delete(query);
  }
}

const productServices = new ProductServices();

export default productServices;
