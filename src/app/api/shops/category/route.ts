import { categoryServices, dbSearchService } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
  SearchResult,
} from "@/types";
const log = createLogger("route");

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      const activeCategories = await categoryServices.getActiveCategories();
      const searchResults: SearchResult[] = activeCategories.map(
        (category) => ({
          id: category.id,
          title: category.name,
          image_key: "",
          subtitle: "category",
          type: "category",
        })
      );
      return jsonResponse(
        createSuccessResponse(
          searchResults,
          "Active categories fetched successfully"
        ),
        200
      );
    }

    const esResponse = await dbSearchService.searchCategories({
      query: query.trim(),
      limit: 10,
    });

    const searchResults: SearchResult[] = esResponse.hits.map((category) => ({
      id: category.id,
      title: category.name,
      image_key: "",
      subtitle: "category",
      type: "category",
    }));

    return jsonResponse(
      createSuccessResponse(searchResults, "Categories fetched successfully"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "Error fetching categories:");
    return jsonResponse(createErrorResponse("Failed to fetch categories"), 500);
  }
}
