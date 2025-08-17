import { NextResponse } from "next/server";
import shopServices from "@/services/shop.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

/**
 * Retrieves detailed information for a specific shop by its unique identifier.
 *
 * This API endpoint fetches comprehensive shop details for a given shop ID, including
 * shop metadata, contact information, operating hours, and other relevant shop data.
 * The endpoint validates the shop ID parameter and returns detailed shop information
 * if the shop exists, or an appropriate error response if the shop is not found.
 *
 * @param request - The Next.js request object (no query parameters required)
 * @param params - Route parameters containing the shop identifier
 * @param params.shop_id - The unique identifier of the shop to retrieve
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with detailed shop information
 *   - 404: Not found when shop with given ID doesn't exist
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When shop retrieval fails due to service errors or database issues
 *
 * @example
 * ```typescript
 * // GET /api/shops/shop123
 * const response = await fetch('/api/shops/shop123');
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log('Shop details:', result.data);
 *   console.log(`Shop name: ${result.data.name}`);
 *   console.log(`Shop location: ${result.data.location}`);
 * } else {
 *   console.error('Shop not found:', result.message);
 * }
 * ```
 *
 * @remarks
 * - No authentication required - public endpoint for accessing shop information
 * - Shop ID is extracted from the URL path parameter
 * - Returns complete shop profile including business details and contact information
 * - Useful for displaying shop information on product pages or shop directories
 * - Logs errors for debugging while returning user-friendly error messages
 * - Returns 404 status when shop doesn't exist instead of empty response
 *
 * @see {@link shopServices.getShopById} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(
  request: Request,
  { params }: { params: { shop_id: string } },
) {
  try {
    const { shop_id } = params;
    const shop = await shopServices.getShopById(shop_id);

    if (!shop) {
      const errorResponse = createErrorResponse("Shop not found");
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const successResponse = createSuccessResponse(
      shop,
      "Shop retrieved successfully",
    );
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("GET SHOP ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred.",
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
