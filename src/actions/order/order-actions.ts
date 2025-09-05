"use server";

import { OrderStatus, PaymentMethod } from "@prisma/client";

import { auth } from "@/auth";
import { authUtils } from "@/lib/utils-functions";
import orderRepository from "@/repositories/order.repository";
import orderService from "@/services/order.service";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function createOrderAction({
  shop_id,
  payment_method,
  delivery_address_id,
}: {
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
}) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return createErrorResponse("Unauthorized: Please log in.");
    }
    const pg_payment_id =
      payment_method === "ONLINE" ? `txn_${new Date().getTime()}` : "offline";

    const order = await orderService.createOrderFromCart(
      user_id,
      shop_id,
      payment_method,
      delivery_address_id,
      pg_payment_id
    );

    // TODO: revalidatePath
    return createSuccessResponse(order, "Order placed successfully!");
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return createErrorResponse("Failed to create order.");
  }
}

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

    const order = await orderRepository.getOrderById(order_id, {
      select: { shop_id: true },
    });
    if (!order || order.shop_id !== shop_id) {
      return createErrorResponse(
        "Unauthorized: Order does not belong to your shop."
      );
    }

    const updatedOrder = await orderRepository.updateStatus(order_id, status);

    // TODO:revalidate
    return createSuccessResponse(
      updatedOrder,
      `Order status updated to ${status}`
    );
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    return createErrorResponse("Failed to update order status.");
  }
}
