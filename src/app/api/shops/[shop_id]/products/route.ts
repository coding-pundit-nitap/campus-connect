import { NextResponse } from "next/server";

import { Prisma } from "@/../prisma/generated/client";
import { prisma } from "@/lib/prisma";
import { serializeProducts, SortBy } from "@/lib/utils/product.utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  try {
    const { shop_id } = await params;

    if (!shop_id) {
      const errorResponse = createErrorResponse("Shop ID is required.");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor") || undefined;
    const sortBy = searchParams.get("sortBy") as SortBy | undefined;
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const inStockParam = searchParams.get("inStock");
    const inStock =
      inStockParam === "true"
        ? true
        : inStockParam === "false"
          ? false
          : undefined;

    const VALID_SORT_FIELDS = ["name", "price", "created_at", "stock_quantity"];
    const effectiveSortBy =
      sortBy && VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";

    const whereClause: Prisma.ProductWhereInput = {
      shop_id,
      deleted_at: null,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (categoryId) {
      whereClause.category_id = categoryId;
    }

    if (inStock === true) {
      whereClause.stock_quantity = { gt: 0 };
    } else if (inStock === false) {
      whereClause.stock_quantity = { lte: 0 };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { [effectiveSortBy]: sortOrder },
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

    let nextCursor: typeof cursor | null = null;
    if (products.length > limit) {
      const lastItem = products.pop();
      nextCursor = lastItem!.id;
    }

    const responseData = {
      data: serializeProducts(products),
      nextCursor,
    };
    const successResponse = createSuccessResponse(
      responseData,
      "Products retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
