import { jsonResponse } from "@/lib/serializers/response-serializer";
import { categoryServices } from "@/services/category/category.service";
import dbSearchService from "@/services/search/db-search.service";
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
    console.error("Error fetching categories:", error);
    return jsonResponse(createErrorResponse("Failed to fetch categories"), 500);
  }
}
