import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import productServices from "@/services/product.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export const config = {
  runtime: "edge",
};
/**
 * Retrieves products from a specific shop with cursor-based pagination.
 *
 * This API endpoint fetches products belonging to a specific shop identified by the shop_id
 * parameter. It implements cursor-based pagination for efficient loading of large product
 * datasets. Products are returned in reverse chronological order (newest first) based on
 * their creation date. The endpoint supports configurable page sizes and provides cursor
 * information for seamless pagination.
 *
 * @param request - The Next.js request object containing query parameters for pagination
 * @param params - Route parameters containing the shop_id
 * @param params.shop_id - The unique identifier of the shop whose products to retrieve
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with paginated products and next cursor
 *   - 400: Bad request when shop_id is missing or invalid
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When product retrieval fails due to service errors or database issues
 *
 * @see {@link productServices.getProductsByShopId} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shop_id: string }> },
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
    };

    const products = await productServices.getProductsByShopId(
      shop_id,
      queryOptions,
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
      "Products retrieved successfully",
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred.",
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
