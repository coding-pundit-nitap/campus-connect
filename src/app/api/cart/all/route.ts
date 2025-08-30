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
 * Retrieves all shopping carts for the authenticated user across all shops.
 *
 * This API endpoint fetches all carts associated with the authenticated user,
 * including carts from different shops with their complete item details and
 * product information. Used for displaying comprehensive cart state and
 * cross-shop cart management operations.
 *
 * @param request - The Next.js request object
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with array of all user carts
 *   - 401: Unauthorized when user is not authenticated
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When cart retrieval fails due to service errors
 *
 */
export async function GET() {
  try {
    await authUtils.isAuthenticated();

    const carts = await cartRepository.getAllUserCarts();
    const successResponse = createSuccessResponse(
      carts,
      "All carts retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET ALL CARTS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
