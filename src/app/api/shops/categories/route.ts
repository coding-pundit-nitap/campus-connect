import { NextResponse } from "next/server";

import { authUtils } from "@/lib/utils/auth.utils.server";
import { dbSearchService } from "@/services/search/db-search.service";
import {
  createErrorResponse,
  createSuccessResponse,
  SearchResult,
} from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      const errorResponse = createErrorResponse("Search query is required");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const shopId = await authUtils.getOwnedShopId();

    const esResponse = await dbSearchService.searchCategories({
      query: query.trim(),
      shopId: shopId ?? undefined,
      limit: 10,
    });

    const searchResults: SearchResult[] = esResponse.hits.map((category) => ({
      id: category.id,
      title: category.name,
      image_key: "",
      subtitle: "category",
      type: "category",
      shop_id: category.shop_id,
    }));

    return NextResponse.json(
      createSuccessResponse(searchResults, "Categories fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      createErrorResponse("Failed to fetch categories"),
      { status: 500 }
    );
  }
}
