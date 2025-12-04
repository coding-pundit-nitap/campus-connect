import { NextRequest, NextResponse } from "next/server";

import { productRepository } from "@/repositories";
import { SearchResult } from "@/types";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      const errorResponse = createErrorResponse("Search query is required");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const trimmedQuery = query.trim();

    const products = await productRepository.searchProducts(trimmedQuery, 5);

    const searchResults: SearchResult[] = [
      ...products.map((product) => ({
        id: product.id,
        title: product.name,
        subtitle: product.shop.name,
        type: "product" as const,
        image_key: product.image_key,
        shop_id: product.shop.id,
      })),
    ];

    const successResponse = createSuccessResponse(
      searchResults,
      "Search completed successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred during search."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
