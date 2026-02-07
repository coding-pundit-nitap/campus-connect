import { Prisma, Product } from "@/generated/client";
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
    return product;
  }
  async delete(product_id: string): Promise<Product> {
    const product = await prisma.product.update({
      where: { id: product_id },
      data: { deleted_at: new Date() },
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
    const trimmed = searchTerm.trim();

    return prisma.product.findMany({
      where: {
        deleted_at: null,
        shop: { is_active: true, deleted_at: null },
        OR: trimmed
          ? [
              { name: { contains: trimmed, mode: "insensitive" } },
              { description: { contains: trimmed, mode: "insensitive" } },
              {
                category: { name: { contains: trimmed, mode: "insensitive" } },
              },
              { shop: { name: { contains: trimmed, mode: "insensitive" } } },
            ]
          : undefined,
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
  async count(args: Prisma.ProductCountArgs) {
    return prisma.product.count(args);
  }
}

export const productRepository = new ProductRepository();

export default productRepository;
