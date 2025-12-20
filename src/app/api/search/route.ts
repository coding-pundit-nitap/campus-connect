import { NextRequest, NextResponse } from "next/server";

import { esSearchService } from "@/services/search/es-search.service";
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

    const results = await esSearchService.globalSearch(query.trim());

    const successResponse = createSuccessResponse(
      results,
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
