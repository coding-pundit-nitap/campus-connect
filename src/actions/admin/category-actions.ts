"use server";

import z from "zod";

import { Prisma } from "@/../prisma/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { verifyAdmin } from "../authentication/admin";

const getCategoriesSchema = searchSchema.extend({
  shop_id: z.string().optional(),
});

export type CategoryEntry = {
  id: string;
  name: string;
  productCount: number;
  shop: {
    id: string;
    name: string;
  };
};

export async function getAllCategoriesAction(
  options: z.infer<typeof getCategoriesSchema>
): Promise<ActionResponse<CursorPaginatedResponse<CategoryEntry>>> {
  try {
    await verifyAdmin();

    const parsedData = getCategoriesSchema.safeParse(options);
    if (!parsedData.success) {
      throw new BadRequestError("Invalid options");
    }

    const { limit, cursor, search, shop_id } = parsedData.data;

    const where: Prisma.CategoryWhereInput = {};

    if (shop_id) {
      where.shop_id = shop_id;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shop: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const categories = await prisma.category.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    const hasMore = categories.length > limit;
    const data = hasMore ? categories.slice(0, -1) : categories;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return createSuccessResponse(
      {
        data: data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          productCount: cat._count.products,
          shop: cat.shop,
        })),
        nextCursor,
        hasMore,
      },
      "Categories retrieved successfully"
    );
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve categories.");
  }
}

export type CategoryStats = {
  totalCategories: number;
  categoriesWithProducts: number;
  emptyCategories: number;
  topCategories: { name: string; count: number }[];
};

export async function getCategoryStatsAction(): Promise<
  ActionResponse<CategoryStats>
> {
  try {
    await verifyAdmin();

    const categories = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { products: true },
        },
      },
    });

    const totalCategories = categories.length;
    const categoriesWithProducts = categories.filter(
      (c) => c._count.products > 0
    ).length;
    const emptyCategories = totalCategories - categoriesWithProducts;

    const categoryNameCounts = new Map<string, number>();
    for (const cat of categories) {
      const current = categoryNameCounts.get(cat.name) ?? 0;
      categoryNameCounts.set(cat.name, current + cat._count.products);
    }

    const topCategories = [...categoryNameCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return createSuccessResponse(
      {
        totalCategories,
        categoriesWithProducts,
        emptyCategories,
        topCategories,
      },
      "Category statistics retrieved successfully"
    );
  } catch (error) {
    console.error("GET CATEGORY STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve category statistics.");
  }
}
