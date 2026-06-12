import { Category, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateCategoryDto = Prisma.CategoryCreateInput;
export type UpdateCategoryDto = Omit<Prisma.CategoryUpdateArgs, "where">;

export class CategoryRepository extends BaseRepository<
  Category,
  Prisma.CategoryFindUniqueArgs,
  Prisma.CategoryFindManyArgs,
  Prisma.CategoryCreateArgs,
  Prisma.CategoryUpdateArgs,
  Prisma.CategoryDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.category);
  }

  async findById(id: string): Promise<Category | null>;
  async findById<T extends Omit<Prisma.CategoryFindUniqueArgs, "where">>(
    id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.CategoryDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    id: string,
    options?: Omit<Prisma.CategoryFindUniqueArgs, "where">
  ): Promise<
    | Category
    | null
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Omit<Prisma.CategoryFindUniqueArgs, "where"> & {
          where: { id: string };
        },
        "findUnique"
      >
  > {
    return this.prismaClient.category.findUnique({
      where: { id },
      ...options,
    });
  }

  async findByName(name: string): Promise<Category | null>;
  async findByName<T extends Omit<Prisma.CategoryFindUniqueArgs, "where">>(
    name: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.CategoryDelegate,
    T & { where: { name: string } },
    "findUnique"
  > | null>;
  async findByName(
    name: string,
    options?: Omit<Prisma.CategoryFindUniqueArgs, "where">
  ): Promise<
    | Category
    | null
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Omit<Prisma.CategoryFindUniqueArgs, "where"> & {
          where: { name: string };
        },
        "findUnique"
      >
  > {
    return this.prismaClient.category.findUnique({
      where: { name },
      ...options,
    });
  }

  async searchCategory(
    searchTerm: string,
    limit: number = 10
  ): Promise<Category[]> {
    return this.prismaClient.category.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      take: limit,
    });
  }

  async findOrCreate(name: string): Promise<Category> {
    const existingCategory = await this.findByName(name);

    if (existingCategory) {
      return existingCategory;
    }

    return this.create({ data: { name } });
  }

  async deleteEmptyCategories(): Promise<string[]> {
    const emptyCategories = await this.prismaClient.category.findMany({
      where: {
        products: {
          none: {},
        },
      },
      select: { id: true, name: true },
    });

    if (emptyCategories.length === 0) {
      return [];
    }

    const categoryIds = emptyCategories.map((cat) => cat.id);
    await this.prismaClient.category.deleteMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });
    return categoryIds;
  }

  async deleteIfEmpty(category_id: string): Promise<boolean> {
    const category = await this.prismaClient.category.findUnique({
      where: { id: category_id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return false;
    }

    if (category._count.products === 0) {
      await this.delete(category_id);
      return true;
    }

    return false;
  }

  async getActiveCategories(): Promise<Category[]> {
    return this.prismaClient.category.findMany({
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

  async findUnique<T extends Prisma.CategoryFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.CategoryDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.CategoryFindUniqueArgs
  ): Promise<Category | null>;
  override async findUnique(
    args: Prisma.CategoryFindUniqueArgs
  ): Promise<
    | Category
    | null
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Prisma.CategoryFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.category.findUnique(args);
  }

  async findMany<T extends Prisma.CategoryFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.CategoryDelegate, T, "findMany">>;
  override async findMany(
    args?: Prisma.CategoryFindManyArgs
  ): Promise<Category[]>;
  override async findMany(
    args?: Prisma.CategoryFindManyArgs
  ): Promise<
    | Category[]
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Prisma.CategoryFindManyArgs,
        "findMany"
      >
  > {
    return this.prismaClient.category.findMany(args);
  }

  async create<T extends Prisma.CategoryCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.CategoryDelegate, T, "create">>;
  override async create(args: Prisma.CategoryCreateArgs): Promise<Category>;
  override async create(
    args: Prisma.CategoryCreateArgs
  ): Promise<
    | Category
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Prisma.CategoryCreateArgs,
        "create"
      >
  > {
    return this.prismaClient.category.create(args);
  }

  async update<T extends Prisma.CategoryUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.CategoryDelegate, T, "update">>;
  override async update(args: Prisma.CategoryUpdateArgs): Promise<Category>;
  async update<T extends Omit<Prisma.CategoryUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.CategoryUpdateInput,
    options?: T
  ): Promise<Category>;
  override async update(
    idOrArgs: string | Prisma.CategoryUpdateArgs,
    data?: Prisma.CategoryUpdateInput,
    options?: Omit<Prisma.CategoryUpdateArgs, "where" | "data">
  ): Promise<
    | Category
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Prisma.CategoryUpdateArgs,
        "update"
      >
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.category.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.category.update(idOrArgs);
  }

  async delete<T extends Prisma.CategoryDeleteArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.CategoryDelegate, T, "delete">>;
  override async delete(args: Prisma.CategoryDeleteArgs): Promise<Category>;
  async delete(id: string): Promise<Category>;
  override async delete(
    idOrArgs: string | Prisma.CategoryDeleteArgs
  ): Promise<
    | Category
    | Prisma.Result<
        Prisma.CategoryDelegate,
        Prisma.CategoryDeleteArgs,
        "delete"
      >
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.category.delete({
        where: { id: idOrArgs },
      });
    }
    return this.prismaClient.category.delete(idOrArgs);
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
