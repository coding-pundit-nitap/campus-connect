import { Category, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateCategoryDto = Prisma.CategoryCreateInput;
export type UpdateCategoryDto = Omit<Prisma.CategoryUpdateArgs, "where">;

type CategoryFindOptions = Omit<Prisma.CategoryFindUniqueArgs, "where">;
type CategoryFindManyOptions = Omit<Prisma.CategoryFindManyArgs, "where">;

class CategoryRepository {
  async findById(
    category_id: string,
    options?: CategoryFindOptions
  ): Promise<Category | null> {
    const query = { where: { id: category_id }, ...(options ?? {}) };
    return prisma.category.findUnique(query);
  }

  async findByNameAndShop(
    name: string,
    shop_id: string,
    options?: CategoryFindOptions
  ): Promise<Category | null> {
    const query = {
      where: {
        shop_id_name: {
          shop_id: shop_id,
          name: name,
        },
      },
      ...(options ?? {}),
    };
    return prisma.category.findUnique(query);
  }

  async findManyByShopId(
    shop_id: string,
    options?: CategoryFindManyOptions
  ): Promise<Category[]> {
    const query = { where: { shop_id }, ...(options ?? {}) };
    return prisma.category.findMany(query);
  }

  async searchCategory(
    searchTerm: string,
    limit: number = 10
  ): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      take: limit,
    });
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    return prisma.category.create({ data });
  }

  async update(
    category_id: string,
    data: UpdateCategoryDto
  ): Promise<Category> {
    return prisma.category.update({ where: { id: category_id }, ...data });
  }

  async delete(category_id: string): Promise<Category> {
    return prisma.category.delete({ where: { id: category_id } });
  }

  async findOrCreate(name: string, shop_id: string): Promise<Category> {
    const existingCategory = await this.findByNameAndShop(name, shop_id);

    if (existingCategory) {
      return existingCategory;
    }

    return this.create({
      name,
      shop: {
        connect: { id: shop_id },
      },
    });
  }

  async deleteEmptyCategories(shop_id?: string): Promise<string[]> {
    const emptyCategories = await prisma.category.findMany({
      where: {
        ...(shop_id && { shop_id }),
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
    await prisma.category.deleteMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });
    return categoryIds;
  }

  async deleteIfEmpty(category_id: string): Promise<boolean> {
    const category = await prisma.category.findUnique({
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
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
