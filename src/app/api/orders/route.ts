import { NextResponse } from "next/server";

import { auth } from "@/auth";
import orderServices from "@/services/order.services";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

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
 *
 * @see {@link orderServices.getOrdersByUserId} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const orders = await orderServices.getOrdersByUserId({
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
