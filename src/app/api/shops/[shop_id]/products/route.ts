import { NextResponse } from "next/server";
import z from "zod";

import { Prisma } from "@/generated/client";
import { paginateCursor } from "@/lib/paginate";
import { prisma } from "@/lib/prisma";
import { serializeProducts } from "@/lib/utils/product.utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { cursorPaginationSchema } from "@/validations/pagination.validation";

export const dynamic = "force-dynamic";

const shopProductsQuerySchema = cursorPaginationSchema.extend({
  sortBy: z.enum(["name", "price", "created_at", "stock_quantity"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),
});

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

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = shopProductsQuerySchema.parse(searchParams);

    const effectiveSortBy = parsed.sortBy || "created_at";

    const whereClause: Prisma.ProductWhereInput = {
      shop_id,
      deleted_at: null,
    };

    if (parsed.search) {
      whereClause.OR = [
        { name: { contains: parsed.search, mode: "insensitive" } },
        { description: { contains: parsed.search, mode: "insensitive" } },
        {
          category: { name: { contains: parsed.search, mode: "insensitive" } },
        },
      ];
    }

    if (parsed.categoryId) {
      whereClause.category_id = parsed.categoryId;
    }

    if (parsed.inStock === true) {
      whereClause.stock_quantity = { gt: 0 };
    } else if (parsed.inStock === false) {
      whereClause.stock_quantity = { lte: 0 };
    }

    const result = await paginateCursor(
      ({ take, cursor }) =>
        prisma.product.findMany({
          where: whereClause,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          skip: cursor ? 1 : 0,
          orderBy: { [effectiveSortBy]: parsed.sortOrder },
          include: {
            category: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      parsed.limit,
      parsed.cursor
    );

    const successResponse = createSuccessResponse(
      {
        ...result,
        data: serializeProducts(result.data),
      },
      "Products retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(error.issues.map((e) => e.message).join(", ")),
        { status: 400 }
      );
    }
    console.error("GET PRODUCTS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
