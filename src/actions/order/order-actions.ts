"use server";

import { auth } from "@/auth";
import orderServices from "@/services/order.services";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";
import { OrderStatus, PaymentMethod } from "@prisma/client";

/**
 * Creates a new order from the user's cart for a specific shop.
 *
 * This server action authenticates the user, processes their cart items for the specified shop,
 * and creates an order with the provided payment method. For online payments, it generates
 * a temporary payment gateway transaction ID.
 *
 * @param params - The order creation parameters
 * @param params.shop_id - The unique identifier of the shop to create the order for
 * @param params.payment_method - The payment method chosen by the user (ONLINE, COD, etc.)
 *
 * @returns A promise that resolves to a response object containing:
 *   - success: boolean indicating if the order was created successfully
 *   - data: the created order object (if successful)
 *   - message: success or error message
 *
 * @throws {Error} When order creation fails due to service errors
 *
 * @example
 * ```typescript
 * const result = await createOrderAction({
 *   shop_id: "shop_123",
 *   payment_method: "ONLINE"
 * });
 *
 * if (result.success) {
 *   console.log("Order created:", result.data);
 * } else {
 *   console.error("Order failed:", result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires user authentication via session
 * - Automatically generates payment gateway ID for online payments
 * - Clears the user's cart items for the specified shop after order creation
 * - TODO: Implement actual payment processing integration
 * - TODO: Add revalidatePath for cache invalidation
 *
 * @see {@link orderServices.createOrderFromCart} for the underlying service method
 * @see {@link PaymentMethod} for available payment options
 */
export async function createOrderAction({
  shop_id,
  payment_method,
}: {
  shop_id: string;
  payment_method: PaymentMethod;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized: Please log in.");
    }

    // TODO: Implement payment processing
    const pg_payment_id =
      payment_method === "ONLINE" ? `txn_${new Date().getTime()}` : undefined;

    const order = await orderServices.createOrderFromCart(
      session.user.id,
      shop_id,
      payment_method,
      pg_payment_id,
    );

    // TODO: revalidatePath
    return createSuccessResponse(order, "Order placed successfully!");
  } catch (error: any) {
    console.error("CREATE ORDER ERROR:", error);
    return createErrorResponse(error.message || "Failed to create order.");
  }
}

/**
 * Updates the status of an existing order.
 *
 * This server action allows shop owners to update the status of orders belonging to their shop.
 * It verifies that the authenticated user owns the shop and has permission to modify the order.
 *
 * @param params - The order status update parameters
 * @param params.order_id - The unique identifier of the order to update
 * @param params.status - The new status to assign to the order
 *
 * @returns A promise that resolves to a response object containing:
 *   - success: boolean indicating if the status was updated successfully
 *   - data: the updated order object (if successful)
 *   - message: success or error message with the new status
 *
 * @throws {Error} When status update fails due to service errors or authorization issues
 *
 * @example
 * ```typescript
 * const result = await updateOrderStatusAction({
 *   order_id: "order_456",
 *   status: "SHIPPED"
 * });
 *
 * if (result.success) {
 *   console.log("Status updated:", result.data);
 * } else {
 *   console.error("Update failed:", result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires seller authentication (user must have a shop_id)
 * - Verifies order ownership before allowing status updates
 * - Only shop owners can update their own orders
 * - TODO: Add revalidatePath for cache invalidation
 *
 * @see {@link orderServices.updateOrderStatus} for the underlying service method
 * @see {@link OrderStatus} for available order statuses
 */
export async function updateOrderStatusAction({
  order_id,
  status,
}: {
  order_id: string;
  status: OrderStatus;
}) {
  try {
    const session = await auth();
    const shop_id = session?.user?.shop_id;
    if (!shop_id) {
      return createErrorResponse("Unauthorized: You are not a seller.");
    }

    const order = await orderServices.getOrderById(order_id, {
      select: { shop_id: true },
    });
    if (!order || order.shop_id !== shop_id) {
      return createErrorResponse(
        "Unauthorized: Order does not belong to your shop.",
      );
    }

    const updatedOrder = await orderServices.updateOrderStatus(
      order_id,
      status,
    );

    // TODO:revalidate
    return createSuccessResponse(
      updatedOrder,
      `Order status updated to ${status}`,
    );
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    return createErrorResponse("Failed to update order status.");
  }
}
