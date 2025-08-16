
'use server';

import { auth } from "@/auth";
import orderServices from "@/services/order.services";
import { createErrorResponse, createSuccessResponse } from "@/types/response.type";
import { OrderStatus, PaymentMethod } from "@prisma/client";

export async function createOrderAction({ shop_id, payment_method }: { shop_id: string; payment_method: PaymentMethod }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized: Please log in.");
    }

    // TODO: Implement payment processing
    const pg_payment_id = payment_method === 'ONLINE' ? `txn_${new Date().getTime()}` : undefined;
    
    const order = await orderServices.createOrderFromCart(session.user.id, shop_id, payment_method, pg_payment_id);
    
    // TODO: revalidatePath
    return createSuccessResponse(order, "Order placed successfully!");

  } catch (error: any) {
    console.error("CREATE ORDER ERROR:", error);
    return createErrorResponse(error.message || "Failed to create order.");
  }
}

// Action for a seller to update the status of an order
export async function updateOrderStatusAction({ order_id, status }: { order_id: string; status: OrderStatus }) {
  try {
    const session = await auth();
    const shop_id = session?.user?.shop_id;
    if (!shop_id) {
      return createErrorResponse("Unauthorized: You are not a seller.");
    }

    const order = await orderServices.getOrderById(order_id, { select: { shop_id: true } });
    if (!order || order.shop_id !== shop_id) {
      return createErrorResponse("Unauthorized: Order does not belong to your shop.");
    }

    const updatedOrder = await orderServices.updateOrderStatus(order_id, status);

    // TODO:revalidate
    return createSuccessResponse(updatedOrder, `Order status updated to ${status}`);

  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    return createErrorResponse("Failed to update order status.");
  }
}