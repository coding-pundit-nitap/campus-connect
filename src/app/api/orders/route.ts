import { NextResponse } from "next/server";
import { auth } from "@/auth";
import orderServices from "@/services/order.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

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
 *
 * @example
 * ```typescript
 * // GET /api/orders
 * const response = await fetch('/api/orders', {
 *   headers: { 'Cookie': 'session=...' }
 * });
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log('User orders:', result.data);
 *   result.data.forEach(order => {
 *     console.log(`Order ${order.id}: ${order.status}`);
 *   });
 * } else {
 *   console.error('Failed to get orders:', result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires valid user session for authentication
 * - Returns complete order history for the authenticated user
 * - Order data includes product details, quantities, pricing, and status
 * - Orders typically include timestamps, delivery information, and payment status
 * - Logs errors for debugging while returning user-friendly error messages
 * - No pagination implemented - returns all user orders
 *
 * @see {@link orderServices.getOrdersByUserId} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const orders = await orderServices.getOrdersByUserId(session.user.id);
    const successResponse = createSuccessResponse(
      orders,
      "Orders retrieved successfully",
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
