import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import orderServices from "@/services/order.services";

/**
 * Retrieves all orders for a specific authenticated user.
 *
 * This API endpoint fetches all orders placed by a specific user identified by the user_id
 * parameter. It requires user authentication and ensures that users can only access their
 * own order history through authorization checks. The endpoint returns all orders associated
 * with the authenticated user, including order details, shop information, item details,
 * and order status. This allows users to view and track their purchase history.
 *
 * @param request - The Next.js request object (no query parameters required)
 * @param params - Route parameters containing the user identifier
 * @param params.user_id - The unique identifier of the user whose orders to retrieve
 *
 * @returns A promise that resolves to a NextResponse containing:
 *   - 200: Success response with array of user's orders
 *   - 401: Unauthorized when user is not authenticated
 *   - 403: Forbidden when user tries to access another user's orders
 *   - 500: Internal server error for unexpected failures
 *
 * @throws {Error} When order retrieval fails due to service errors or database issues
 *
 * @example
 * ```typescript
 * // GET /api/users/user123/orders
 * const response = await fetch('/api/users/user123/orders', {
 *   headers: { 'Cookie': 'session=...' }
 * });
 *
 * const orders = await response.json();
 * if (response.ok) {
 *   console.log('User orders:', orders);
 *   orders.forEach(order => {
 *     console.log(`Order ${order.id}: ${order.status} - Shop: ${order.shop_name}`);
 *   });
 * } else {
 *   console.error('Failed to get orders:', orders.error);
 * }
 * ```
 *
 * @remarks
 * - Requires valid user session for authentication
 * - Users can only access their own order history (user_id must match session user ID)
 * - Order data includes shop details, product information, quantities, and pricing
 * - Orders typically include timestamps, delivery status, and payment information
 * - Useful for users to track their purchase history and order status
 * - Logs errors for debugging while returning user-friendly error messages
 * - No pagination implemented - returns all user orders
 * - Authorization check prevents users from accessing other users' order data
 *
 * @see {@link orderServices.getOrdersByUserId} for the underlying service method
 * @see {@link auth} for the authentication mechanism
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id } = params;

    if (session.user.id !== user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await orderServices.getOrdersByUserId(user_id);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
