import { Category, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateCategoryDto = Prisma.CategoryCreateInput;
export type UpdateCategoryDto = Omit<Prisma.CategoryUpdateArgs, "where">;

type CategoryFindOptions = Omit<Prisma.CategoryFindUniqueArgs, "where">;

export class CategoryRepository extends BaseRepository<
  Category,
  Prisma.CategoryDelegate
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.category);
  }

  async findByName(
    name: string,
    options?: CategoryFindOptions
  ): Promise<Category | null> {
    const query = {
      where: { name },
      ...(options ?? {}),
    };
    return this.prismaClient.category.findUnique(
      query
    ) as Promise<Category | null>;
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
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
