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
 * Retrieves all orders for the authenticated seller's shop.
 *
 * This API endpoint fetches all orders placed at the seller's shop. It requires
 * seller authentication (user must have a shop_id) and returns all orders associated
 * with the seller's shop, including order details, customer information, item details,
 * and order status. This allows sellers to manage and track orders placed at their shop.
 *
 * @param request - The Next.js request object (no query parameters required)
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with array of shop's orders
 *   - 401: Unauthorized when user is not authenticated or doesn't have a shop
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When order retrieval fails due to service errors
 *
 * @see {@link orderRepository.getOrdersByShopId} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET() {
  try {
    const shop_id = await authUtils.getShopId();
    const orders = await orderRepository.getOrdersByShopId(shop_id);
    const successResponse = createSuccessResponse(
      orders,
      "Seller orders retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET SELLER ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
