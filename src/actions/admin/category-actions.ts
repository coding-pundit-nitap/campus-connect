"use server";

import z from "zod";

import { container } from "@/di/container";
import { Prisma } from "@/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { verifyAdmin } from "../authentication/admin";
const log = createLogger("category-actions");

const getCategoriesSchema = searchSchema;

export type CategoryEntry = {
  id: string;
  name: string;
  productCount: number;
  shopCount: number;
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

    const { limit, cursor, search } = parsedData.data;

    const where: Prisma.CategoryWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const categories = await container.categoryRepository.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true,
          },
        },
        products: {
          select: { shop_id: true },
          distinct: ["shop_id"],
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
          shopCount: cat.products.length,
        })),
        nextCursor,
        hasMore,
      },
      "Categories retrieved successfully"
    );
  } catch (error) {
    log.error({ err: error }, "GET CATEGORIES ERROR:");
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

    const categories = await container.categoryRepository.findMany({
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

    const topCategories = categories
      .sort((a, b) => b._count.products - a._count.products)
      .slice(0, 5)
      .map((cat) => ({ name: cat.name, count: cat._count.products }));

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
    log.error({ err: error }, "GET CATEGORY STATS ERROR:");
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve category statistics.");
  }
}
