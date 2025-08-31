import { NextResponse } from "next/server";

import authUtils from "@/lib/utils-functions/auth.utils";
import orderRepository from "@/repositories/order.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const config = {
  runtime: "edge",
};
/**
 * Retrieves all orders for the authenticated user.
 *
 * This API endpoint fetches the complete order history for the currently authenticated user.
 * It requires user authentication and returns all orders associated with the user's account,
 * including order details, status, items, and transaction information. The orders are typically
 * returned in reverse chronological order (newest first).
 *
 * @param request - The Next.js request object (no query parameters required)
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with array of user's orders
 *   - 401: Unauthorized when user is not authenticated
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When order retrieval fails due to service errors
 */
export async function GET() {
  try {
    const isAuth = await authUtils.isAuthenticated();
    if (!isAuth) {
      return NextResponse.json(createErrorResponse("User not authenticated"), {
        status: 401,
      });
    }

    const orders = await orderRepository.getOrdersByUserId({
      include: { items: true, shop: true },
    });
    const successResponse = createSuccessResponse(
      orders,
      "Orders retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
