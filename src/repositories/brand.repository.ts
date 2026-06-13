import { Brand, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateBrandDto = Prisma.BrandCreateInput;
export type UpdateBrandDto = Omit<Prisma.BrandUpdateArgs, "where">;

export class BrandRepository extends BaseRepository<
  Brand,
  Prisma.BrandFindUniqueArgs,
  Prisma.BrandFindManyArgs,
  Prisma.BrandCreateArgs,
  Prisma.BrandUpdateArgs,
  Prisma.BrandDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.brand);
  }

  async findById(id: string): Promise<Brand | null>;
  async findById<T extends Omit<Prisma.BrandFindUniqueArgs, "where">>(
    id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.BrandDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    id: string,
    options?: Omit<Prisma.BrandFindUniqueArgs, "where">
  ): Promise<
    | Brand
    | null
    | Prisma.Result<
        Prisma.BrandDelegate,
        Omit<Prisma.BrandFindUniqueArgs, "where"> & {
          where: { id: string };
        },
        "findUnique"
      >
  > {
    return this.prismaClient.brand.findUnique({
      where: { id },
      ...options,
    });
  }

  async findByName(name: string): Promise<Brand | null>;
  async findByName<T extends Omit<Prisma.BrandFindUniqueArgs, "where">>(
    name: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.BrandDelegate,
    T & { where: { name: string } },
    "findUnique"
  > | null>;
  async findByName(
    name: string,
    options?: Omit<Prisma.BrandFindUniqueArgs, "where">
  ): Promise<
    | Brand
    | null
    | Prisma.Result<
        Prisma.BrandDelegate,
        Omit<Prisma.BrandFindUniqueArgs, "where"> & {
          where: { name: string };
        },
        "findUnique"
      >
  > {
    return this.prismaClient.brand.findUnique({
      where: { name },
      ...options,
    });
  }

  async searchBrand(searchTerm: string, limit: number = 10): Promise<Brand[]> {
    return this.prismaClient.brand.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      take: limit,
    });
  }

  async findOrCreate(name: string): Promise<Brand> {
    const existingBrand = await this.findByName(name);

    if (existingBrand) {
      return existingBrand;
    }

    return this.create({ data: { name } });
  }

  async deleteEmptyBrands(): Promise<string[]> {
    const emptyBrands = await this.prismaClient.brand.findMany({
      where: {
        products: {
          none: {},
        },
      },
      select: { id: true, name: true },
    });

    if (emptyBrands.length === 0) {
      return [];
    }

    const brandIds = emptyBrands.map((brand) => brand.id);
    await this.prismaClient.brand.deleteMany({
      where: {
        id: {
          in: brandIds,
        },
      },
    });
    return brandIds;
  }

  async deleteIfEmpty(brand_id: string): Promise<boolean> {
    const brand = await this.prismaClient.brand.findUnique({
      where: { id: brand_id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return false;
    }

    if (brand._count.products === 0) {
      await this.delete(brand_id);
      return true;
    }

    return false;
  }

  async getActiveBrands(): Promise<Brand[]> {
    return this.prismaClient.brand.findMany({
      where: {
        products: {
          some: {
            deleted_at: null,
            shop: {
              is_active: true,
              deleted_at: null,
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findUnique<T extends Prisma.BrandFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.BrandDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.BrandFindUniqueArgs
  ): Promise<Brand | null>;
  override async findUnique(
    args: Prisma.BrandFindUniqueArgs
  ): Promise<
    | Brand
    | null
    | Prisma.Result<
        Prisma.BrandDelegate,
        Prisma.BrandFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.brand.findUnique(args);
  }

  async findMany<T extends Prisma.BrandFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.BrandDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.BrandFindManyArgs): Promise<Brand[]>;
  override async findMany(
    args?: Prisma.BrandFindManyArgs
  ): Promise<
    | Brand[]
    | Prisma.Result<Prisma.BrandDelegate, Prisma.BrandFindManyArgs, "findMany">
  > {
    return this.prismaClient.brand.findMany(args);
  }

  async create<T extends Prisma.BrandCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.BrandDelegate, T, "create">>;
  override async create(args: Prisma.BrandCreateArgs): Promise<Brand>;
  override async create(
    args: Prisma.BrandCreateArgs
  ): Promise<
    | Brand
    | Prisma.Result<Prisma.BrandDelegate, Prisma.BrandCreateArgs, "create">
  > {
    return this.prismaClient.brand.create(args);
  }

  async update<T extends Prisma.BrandUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.BrandDelegate, T, "update">>;
  override async update(args: Prisma.BrandUpdateArgs): Promise<Brand>;
  async update<T extends Omit<Prisma.BrandUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.BrandUpdateInput,
    options?: T
  ): Promise<Brand>;
  override async update(
    idOrArgs: string | Prisma.BrandUpdateArgs,
    data?: Prisma.BrandUpdateInput,
    options?: Omit<Prisma.BrandUpdateArgs, "where" | "data">
  ): Promise<
    | Brand
    | Prisma.Result<Prisma.BrandDelegate, Prisma.BrandUpdateArgs, "update">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.brand.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.brand.update(idOrArgs);
  }

  async delete<T extends Prisma.BrandDeleteArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.BrandDelegate, T, "delete">>;
  override async delete(args: Prisma.BrandDeleteArgs): Promise<Brand>;
  async delete(id: string): Promise<Brand>;
  override async delete(
    idOrArgs: string | Prisma.BrandDeleteArgs
  ): Promise<
    | Brand
    | Prisma.Result<Prisma.BrandDelegate, Prisma.BrandDeleteArgs, "delete">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.brand.delete({
        where: { id: idOrArgs },
      });
    }
    return this.prismaClient.brand.delete(idOrArgs);
  }

  async count(args?: Prisma.BrandCountArgs): Promise<number> {
    return this.prismaClient.brand.count(args);
  }
}
