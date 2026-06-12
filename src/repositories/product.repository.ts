import { Prisma, Product } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateProductDto = Prisma.ProductCreateInput;
export type UpdateProductDto = Prisma.ProductUpdateInput;

type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;
type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;

export class ProductRepository extends BaseRepository<
  Product,
  Prisma.ProductDelegate
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.product);
  }

  override async findById<
    T extends Omit<
      Parameters<Prisma.ProductDelegate["findUnique"]>[0],
      "where"
    >,
  >(
    id: string,
    options?: T
  ): Promise<Prisma.Result<
    Prisma.ProductDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null> {
    return this.prismaClient.product.findFirst({
      where: { id, deleted_at: null },
      ...options,
    } as any) as any;
  }

  override async delete<
    T extends Omit<Parameters<Prisma.ProductDelegate["delete"]>[0], "where">,
  >(
    id: string,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.ProductDelegate,
      T & { where: { id: string } },
      "delete"
    >
  > {
    return this.prismaClient.product.update({
      where: { id },
      data: { deleted_at: new Date() },
      ...options,
    } as any) as any;
  }

  async hardDelete(
    product_id: string,
    data?: Omit<Prisma.ProductDeleteArgs, "where">
  ): Promise<Product> {
    return this.prismaClient.product.delete({
      where: { id: product_id },
      ...data,
    });
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
    return this.prismaClient.product.findMany({
      where: { shop_id, deleted_at: null },
      ...data,
    });
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

    return this.prismaClient.product.findMany({
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
}

export const productRepository = new ProductRepository();
export default productRepository;
