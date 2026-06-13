import { brandServices, dbSearchService } from "@/di/container";
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
      const activeBrands = await brandServices.getActiveBrands();
      const searchResults: SearchResult[] = activeBrands.map((brand) => ({
        id: brand.id,
        title: brand.name,
        image_key: "",
        subtitle: "brand",
        type: "brand",
      }));
      return jsonResponse(
        createSuccessResponse(
          searchResults,
          "Active brands fetched successfully"
        ),
        200
      );
    }

    const esResponse = await dbSearchService.searchBrands({
      query: query.trim(),
      limit: 10,
    });

    const searchResults: SearchResult[] = esResponse.hits.map((brand) => ({
      id: brand.id,
      title: brand.name,
      image_key: "",
      subtitle: "brand",
      type: "brand",
    }));

    return jsonResponse(
      createSuccessResponse(searchResults, "Brands fetched successfully"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "Error fetching brands:");
    return jsonResponse(createErrorResponse("Failed to fetch brands"), 500);
  }
}
