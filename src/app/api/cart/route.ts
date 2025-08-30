import { NextResponse } from "next/server";

import authUtils from "@/lib/utils/auth.utils";
import cartRepository from "@/repositories/cart.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

export const config = {
  runtime: "edge",
};

/**
 * Retrieves the shopping cart for a specific shop and authenticated user.
 *
 * This API endpoint fetches the user's cart items for a particular shop. It requires
 * user authentication and a shop_id query parameter to identify which shop's cart
 * to retrieve. The cart includes all items the user has added from the specified shop.
 *
 * @param request - The Next.js request object containing query parameters
 * @param request.url - URL containing shop_id as a query parameter
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with cart data for the specified shop
 *   - 400: Bad request when shop_id query parameter is missing
 *   - 401: Unauthorized when user is not authenticated
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When cart retrieval fails due to service errors
 *
 * @example
 * ```typescript
 * // GET /api/cart?shop_id=123
 * const response = await fetch('/api/cart?shop_id=shop123', {
 *   headers: { 'Cookie': 'session=...' }
 * });
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log('Cart items:', result.data);
 * } else {
 *   console.error('Failed to get cart:', result.message);
 * }
 * ```
 *
 * @see {@link cartRepository.getCartForShop} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(request: Request) {
  try {
    await authUtils.isAuthenticated();
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get("shop_id");

    if (!shop_id) {
      const errorResponse = createErrorResponse(
        "shop_id query parameter is required"
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const cart = await cartRepository.getCartForShop(shop_id);
    const successResponse = createSuccessResponse(
      cart,
      "Cart retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET CART ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
