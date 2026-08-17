import { Prisma, Product } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateProductDto = Prisma.ProductCreateInput;
export type UpdateProductDto = Prisma.ProductUpdateInput;

export class ProductRepository extends BaseRepository<
  Product,
  Prisma.ProductFindUniqueArgs,
  Prisma.ProductFindManyArgs,
  Prisma.ProductCreateArgs,
  Prisma.ProductUpdateArgs,
  Prisma.ProductDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.product);
  }

  async findById(id: string): Promise<Product | null>;
  async findById<T extends Omit<Prisma.ProductFindFirstArgs, "where">>(
    id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.ProductDelegate,
    T & { where: { id: string; deleted_at: null } },
    "findFirst"
  > | null>;
  async findById(
    id: string,
    options?: Prisma.ProductFindFirstArgs
  ): Promise<
    | Product
    | null
    | Prisma.Result<
        Prisma.ProductDelegate,
        Omit<Prisma.ProductFindFirstArgs, "where"> & {
          where: { id: string; deleted_at: null };
        },
        "findFirst"
      >
  > {
    // Scope hardening - see base.repository.ts. `deleted_at: null` is part of
    // the scope and must survive any caller-supplied filter.
    const { where, ...rest } = options ?? {};
    return this.prismaClient.product.findFirst({
      ...rest,
      where: { ...where, id, deleted_at: null },
    });
  }

  async findUnique<T extends Prisma.ProductFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ProductDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.ProductFindUniqueArgs
  ): Promise<Product | null>;
  override async findUnique(
    args: Prisma.ProductFindUniqueArgs
  ): Promise<
    | Product
    | null
    | Prisma.Result<
        Prisma.ProductDelegate,
        Prisma.ProductFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.product.findUnique(args);
  }

  async findMany<T extends Prisma.ProductFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.ProductDelegate, T, "findMany">>;
  override async findMany(
    args?: Prisma.ProductFindManyArgs
  ): Promise<Product[]>;
  override async findMany(
    args?: Prisma.ProductFindManyArgs
  ): Promise<
    | Product[]
    | Prisma.Result<
        Prisma.ProductDelegate,
        Prisma.ProductFindManyArgs,
        "findMany"
      >
  > {
    return this.prismaClient.product.findMany(args);
  }

  async create<T extends Prisma.ProductCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ProductDelegate, T, "create">>;
  override async create(args: Prisma.ProductCreateArgs): Promise<Product>;
  override async create(
    args: Prisma.ProductCreateArgs
  ): Promise<
    | Product
    | Prisma.Result<Prisma.ProductDelegate, Prisma.ProductCreateArgs, "create">
  > {
    return this.prismaClient.product.create(args);
  }

  async update<T extends Prisma.ProductUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ProductDelegate, T, "update">>;
  override async update(args: Prisma.ProductUpdateArgs): Promise<Product>;
  async update<T extends Omit<Prisma.ProductUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.ProductUpdateInput,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.ProductDelegate,
      T & { where: { id: string }; data: Prisma.ProductUpdateInput },
      "update"
    >
  >;
  override async update(
    idOrArgs: string | Prisma.ProductUpdateArgs,
    data?: Prisma.ProductUpdateInput,
    options?: Prisma.ProductUpdateArgs
  ): Promise<
    | Product
    | Prisma.Result<Prisma.ProductDelegate, Prisma.ProductUpdateArgs, "update">
  > {
    if (typeof idOrArgs === "string") {
      // Scope hardening - see base.repository.ts.
      const { where, ...rest } = options ?? {};
      return this.prismaClient.product.update({
        ...rest,
        where: { ...where, id: idOrArgs },
        data: data || {},
      });
    }
    return this.prismaClient.product.update(idOrArgs);
  }

  async delete<T extends Prisma.ProductDeleteArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ProductDelegate, T, "delete">>;
  override async delete(args: Prisma.ProductDeleteArgs): Promise<Product>;
  async delete(id: string): Promise<Product>;
  override async delete(
    idOrArgs: string | Prisma.ProductDeleteArgs
  ): Promise<
    | Product
    | Prisma.Result<Prisma.ProductDelegate, Prisma.ProductDeleteArgs, "delete">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.product.update({
        where: { id: idOrArgs },
        data: { deleted_at: new Date() },
      });
    }
    return this.prismaClient.product.update({
      where: idOrArgs.where,
      data: { deleted_at: new Date() },
    });
  }

  async hardDelete(
    product_id: string,
    // `where?: never` keeps the compile-time rejection this signature had
    // before scope hardening. It has no overload pair, so this parameter type
    // IS the public contract - and it is not a naked generic, so full
    // excess-property checking applies (see base.repository.ts). The runtime
    // strip below still stands for `where` values that arrive un-typechecked.
    data?: Omit<Prisma.ProductDeleteArgs, "where"> & { where?: never }
  ): Promise<Product> {
    // Cast so the runtime strip still compiles: the declared type says
    // `where` cannot be here, but the strip is what guarantees it.
    const { where, ...rest } = (data ??
      {}) as Partial<Prisma.ProductDeleteArgs>;
    return this.prismaClient.product.delete({
      ...rest,
      where: { ...where, id: product_id },
    });
  }

  async findManyByShopId(shop_id: string): Promise<Product[]>;
  async findManyByShopId<T extends Prisma.ProductFindManyArgs>(
    shop_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.ProductDelegate,
      T & { where: { shop_id: string; deleted_at: null } },
      "findMany"
    >
  >;
  async findManyByShopId<T extends Prisma.ProductFindManyArgs>(
    shop_id: string,
    options?: T
  ): Promise<
    | Product[]
    | Prisma.Result<
        Prisma.ProductDelegate,
        T & { where: { shop_id: string; deleted_at: null } },
        "findMany"
      >
  > {
    // Scope hardening - see base.repository.ts. This method already
    // destructured `where`, but spread it *last* inside the `where` literal,
    // so a caller filter naming `shop_id` or `deleted_at` still overrode the
    // scope. Scope keys now come last, matching every other scoped method.
    const { where, ...rest } = options || {};
    return this.prismaClient.product.findMany({
      ...rest,
      where: {
        ...where,
        shop_id,
        deleted_at: null,
      },
    });
  }

  async count(args?: Prisma.ProductCountArgs): Promise<number> {
    return this.prismaClient.product.count(args);
  }

  async findStockWatch(user_id: string, product_id: string) {
    return this.prismaClient.stockWatch.findUnique({
      where: { user_id_product_id: { user_id, product_id } },
    });
  }

  async createStockWatch(user_id: string, product_id: string) {
    return this.prismaClient.stockWatch.create({
      data: { user_id, product_id },
    });
  }

  async deleteStockWatch(id: string) {
    return this.prismaClient.stockWatch.delete({ where: { id } });
  }

  async getStockWatches(
    user_id: string,
    // No overload pair - `where?: never` preserves compile-time rejection.
    // See base.repository.ts.
    options?: Omit<Prisma.StockWatchFindManyArgs, "where"> & { where?: never }
  ) {
    const { where, ...rest } = (options ?? {}) as Prisma.StockWatchFindManyArgs;
    return this.prismaClient.stockWatch.findMany({
      ...rest,
      where: { ...where, user_id },
    });
  }

  async getStockWatchersByProductId(
    product_id: string,
    // No overload pair - `where?: never` preserves compile-time rejection.
    // See base.repository.ts.
    options?: Omit<Prisma.StockWatchFindManyArgs, "where"> & { where?: never }
  ) {
    const { where, ...rest } = (options ?? {}) as Prisma.StockWatchFindManyArgs;
    return this.prismaClient.stockWatch.findMany({
      ...rest,
      where: { ...where, product_id },
    });
  }

  async deleteStockWatchesByProductId(product_id: string) {
    return this.prismaClient.stockWatch.deleteMany({ where: { product_id } });
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
