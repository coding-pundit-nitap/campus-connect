"use server";
import { OrderStatus, PaymentMethod } from "@prisma/client";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils-functions";
import {
  serializeOrder,
  serializeOrderWithDetails,
} from "@/lib/utils-functions/order.utils";
import orderRepository from "@/repositories/order.repository";
import notificationService from "@/services/notification.service";
import orderService from "@/services/order.service";
import { SerializedOrderWithDetails } from "@/types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

export async function createOrderAction({
  shop_id,
  payment_method,
  delivery_address_id,
  requested_delivery_time,
}: {
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  requested_delivery_time?: Date;
}) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }
    const pg_payment_id =
      payment_method === "ONLINE"
        ? `txn_${new Date().getTime()}`
        : `offline_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

    const order = await orderService.createOrderFromCart(
      user_id,
      shop_id,
      payment_method,
      delivery_address_id,
      pg_payment_id,
      requested_delivery_time
    );

    return createSuccessResponse(
      serializeOrder(order),
      "Order placed successfully!"
    );
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    throw new InternalServerError("Failed to create order.");
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
    const shop_id = await authUtils.getOwnedShopId();

    const order = await orderRepository.getOrderById(order_id, {
      select: { shop_id: true, user_id: true, display_id: true },
    });
    if (!order || order.shop_id !== shop_id) {
      throw new UnauthorizedError(
        "Unauthorized: Order does not belong to your shop."
      );
    }

    const updatedOrder = await orderRepository.updateStatus(order_id, status);
    await notificationService.publishNotification(order.user_id, {
      title: "Order Status Updated",
      message: `Your order with ID: ${order.display_id} has been updated to ${status}`,
      action_url: `/orders`,
      type: "INFO",
    });

    return createSuccessResponse(
      updatedOrder,
      `Order status updated to ${status}`
    );
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    throw new InternalServerError("Failed to update order status.");
  }
}

export async function getOrderByIdAction(
  order_id: string
): Promise<ActionResponse<SerializedOrderWithDetails>> {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const order = await orderRepository.getOrderById(order_id, {
      include: {
        shop: true,
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
        delivery_address: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.user_id !== user_id) {
      throw new UnauthorizedError(
        "Unauthorized: This order doesn't belong to you."
      );
    }

    return createSuccessResponse(
      serializeOrderWithDetails(order),
      "Order details retrieved successfully"
    );
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);
    throw new InternalServerError("Failed to retrieve order details.");
  }
}
