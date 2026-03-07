import { NextRequest } from "next/server";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { dbSearchService } from "@/services/search/db-search.service";
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
      return jsonResponse(errorResponse, 400);
    }

    const results = await dbSearchService.globalSearch(query.trim());

    const successResponse = createSuccessResponse(
      results,
      "Search completed successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred during search."
    );
    return jsonResponse(errorResponse, 500);
  }
}
