"use server";

import z from "zod";

import { container } from "@/di/container";
import { Prisma } from "@/generated/client";
import { BadRequestError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { cursorArgs, runAdminAction, toCursorPage } from "./_shared";
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
  return runAdminAction(
    log,
    {
      label: "GET CATEGORIES ERROR:",
      fallback: "Failed to retrieve categories.",
    },
    async () => {
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
        ...cursorArgs(limit, cursor),
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

      const { data, nextCursor, hasMore } = toCursorPage(categories, limit);

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
    }
  );
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
  return runAdminAction(
    log,
    {
      label: "GET CATEGORY STATS ERROR:",
      fallback: "Failed to retrieve category statistics.",
    },
    async () => {
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
    }
  );
}
