import { NextResponse } from "next/server";

import { authUtils } from "@/lib/utils-functions";
import { categoryRepository } from "@/repositories";
import { SearchResult } from "@/types";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      const errorResponse = createErrorResponse("Search query is required");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const trimmedQuery = query.trim();

    const categories = await categoryRepository.searchCategory(trimmedQuery);

    const searchResults: SearchResult[] = categories.map((category) => ({
      id: category.id,
      title: category.name,
      imageKey: "",
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
