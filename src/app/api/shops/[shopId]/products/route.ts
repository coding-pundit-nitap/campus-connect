import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import productServices from "@/services/product.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { shopId } = params;

    if (!shopId) {
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
    };

    const products = await productServices.getProductsByShopId(
      shopId,
      queryOptions
    );

    let nextCursor: typeof cursor | null = null;
    if (products.length > limit) {
      const lastItem = products.pop();
      nextCursor = lastItem!.id;
    }

    const responseData = {
      data: products,
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
