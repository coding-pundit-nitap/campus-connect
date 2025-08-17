import { NextResponse } from "next/server";
import { auth } from "@/auth";
import orderServices from "@/services/order.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

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
 * @example
 * ```typescript
 * // GET /api/seller/orders
 * const response = await fetch('/api/seller/orders', {
 *   headers: { 'Cookie': 'session=...' }
 * });
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log('Shop orders:', result.data);
 *   result.data.forEach(order => {
 *     console.log(`Order ${order.id}: ${order.status} - Customer: ${order.customer_name}`);
 *   });
 * } else {
 *   console.error('Failed to get shop orders:', result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires valid seller session with shop_id for authentication
 * - Only returns orders placed at the authenticated seller's shop
 * - Order data includes customer details, product information, quantities, and pricing
 * - Orders typically include timestamps, delivery status, and payment information
 * - Useful for sellers to manage their shop's orders and fulfillment
 * - Logs errors for debugging while returning user-friendly error messages
 * - No pagination implemented - returns all shop orders
 *
 * @see {@link orderServices.getOrdersByShopId} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response formatting
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    const shop_id = session?.user?.shop_id;
    if (!shop_id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const orders = await orderServices.getOrdersByShopId(shop_id);
    const successResponse = createSuccessResponse(
      orders,
      "Seller orders retrieved successfully",
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET SELLER ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
