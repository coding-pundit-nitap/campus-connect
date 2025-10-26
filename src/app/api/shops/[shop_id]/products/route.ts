import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { serializeProducts } from "@/lib/utils/product.utils";
import productRepository from "@/repositories/product.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

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
    const cursor = searchParams.get("cursor");

    const queryOptions = {
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        created_at: Prisma.SortOrder.desc,
      },
      include: {
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    };

    const products = await productRepository.findManyByShopId(
      shop_id,
      queryOptions
    );

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
