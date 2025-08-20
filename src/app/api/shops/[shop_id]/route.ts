import { NextResponse } from "next/server";
import shopServices from "@/services/shop.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export const config = {
  runtime: "edge",
}
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
 * @see {@link shopServices.getShopById} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shop_id: string }> },
) {
  try {
    const { shop_id } = await params;
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
