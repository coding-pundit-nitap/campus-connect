import { NextRequest, NextResponse } from "next/server";

import { esSearchService } from "@/services/search/es-search.service";
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

    const esResponse = await esSearchService.searchProducts({
      query: query.trim(),
      limit: 10,
    });

    const searchResults: SearchResult[] = esResponse.hits.map((product) => ({
      id: product.id,
      title: product.name,
      subtitle: product.shop_name,
      type: "product" as const,
      image_key: product.image_key,
      shop_id: product.shop_id,
    }));

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
