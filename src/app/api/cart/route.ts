import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import cartServices from "@/services/cart.services";
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
 * @see {@link cartServices.getCartForShop} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get("shop_id");

    if (!shop_id) {
      const errorResponse = createErrorResponse(
        "shop_id query parameter is required"
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const cart = await cartServices.getCartForShop(session.user.id, shop_id);
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

/**
 * Validation schema for cart item upsert operations.
 *
 * This schema validates the input data for adding or updating cart items.
 * It ensures that the product_id is a valid string and the quantity is a
 * non-negative integer (0 to remove item, positive to add/update).
 *
 * @property product_id - String identifier for the product to add/update
 * @property quantity - Non-negative integer representing item quantity (0 removes item)
 *
 * @example
 * ```typescript
 * // Valid input
 * const validData = {
 *   product_id: "prod_123",
 *   quantity: 2
 * };
 *
 * // Remove item (quantity 0)
 * const removeData = {
 *   product_id: "prod_123",
 *   quantity: 0
 * };
 * ```
 */
const upsertItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().min(0),
});

/**
 * Adds, updates, or removes items in the user's shopping cart.
 *
 * This API endpoint handles cart item modifications including adding new items,
 * updating quantities of existing items, or removing items (when quantity is 0).
 * It requires user authentication and validates the input data before processing.
 * The operation is atomic and automatically manages cart creation if needed.
 *
 * @param request - The Next.js request object containing cart item data
 * @param request.body - JSON body containing product and quantity information
 * @param request.body.product_id - String identifier of the product to modify
 * @param request.body.quantity - Integer quantity (0 to remove, positive to add/update)
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with updated cart data
 *   - 400: Bad request when input validation fails
 *   - 401: Unauthorized when user is not authenticated
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When cart operation fails due to service errors
 *
 * @see {@link upsertItemSchema} for input validation rules
 * @see {@link cartServices.upsertCartItem} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const body = await request.json();
    const validation = upsertItemSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = createErrorResponse("Invalid input data");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { product_id, quantity } = validation.data;

    const updatedCart = await cartServices.upsertCartItem(
      session.user.id,
      product_id,
      quantity
    );
    const successResponse = createSuccessResponse(
      updatedCart,
      "Cart updated successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("UPSERT CART ITEM ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
