"use server";
import { OrderStatus, PaymentMethod } from "@prisma/client";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils/auth.utils.server";
import {
  orderWithDetailsInclude,
  serializeOrder,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import { getOrderUrl } from "@/lib/utils/url.utils";
import orderRepository from "@/repositories/order.repository";
import { notificationService } from "@/services/notification/notification.service";
import { orderService } from "@/services/order/order.service";
import { SerializedOrderWithDetails } from "@/types";
import {
  ActionResponse,
  createSuccessResponse,
  PaginatedResponse,
} from "@/types/response.types";

export async function getOrdersAction(options: {
  page?: number;
  limit?: number;
}): Promise<ActionResponse<PaginatedResponse<SerializedOrderWithDetails>>> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }
    const queryOptions = {
      page: options.page || 1,
      limit: options.limit || 10,
    };

    const { orders, totalPages, currentPage } = await orderService.getOrders({
      ...queryOptions,
      userId,
    });

    return createSuccessResponse(
      {
        data: orders.map(serializeOrderWithDetails),
        totalPages,
        currentPage,
      },
      "Orders retrieved successfully"
    );
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    throw new InternalServerError("Failed to retrieve orders.");
  }
}

export async function createOrderAction({
  shop_id,
  payment_method,
  delivery_address_id,
  requested_delivery_time,
  upi_transaction_id,
}: {
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  requested_delivery_time?: Date;
  upi_transaction_id?: string;
}) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    if (requested_delivery_time) {
      const deliveryTime = new Date(requested_delivery_time);
      const now = new Date();
      if (isNaN(deliveryTime.getTime())) {
        throw new ValidationError("Invalid delivery time.");
      }
      if (deliveryTime < now) {
        throw new ValidationError("Delivery time cannot be in the past.");
      }
    }
    const pg_payment_id =
      payment_method === "ONLINE"
        ? `txn_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
        : `offline_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const order = await orderService.createOrderFromCart(
      user_id,
      shop_id,
      payment_method,
      delivery_address_id,
      pg_payment_id,
      requested_delivery_time,
      upi_transaction_id
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
      select: {
        shop_id: true,
        user_id: true,
        display_id: true,
        order_status: true,
      },
    });
    if (!order || order.shop_id !== shop_id) {
      throw new UnauthorizedError(
        "Unauthorized: Order does not belong to your shop."
      );
    }

    const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      NEW: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
      READY_FOR_PICKUP: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
      OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowedStatuses = validTransitions[order.order_status] || [];
    if (!allowedStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status transition from ${order.order_status} to ${status}`
      );
    }

    const updatedOrder = await orderRepository.updateStatus(order_id, status);
    if (order.user_id) {
      try {
        await notificationService.publishNotification(order.user_id, {
          title: "Order Status Updated",
          message: `Your order with ID: ${order.display_id} has been updated to ${status}`,
          action_url: getOrderUrl(order_id),
          type: "INFO",
        });
      } catch (error) {
        console.error("Failed to send status update notification:", error);
      }
    }

    return createSuccessResponse(
      { ...updatedOrder, total_price: Number(updatedOrder.total_price) },
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
      include: orderWithDetailsInclude,
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

export async function getShopOrderByIdAction(
  order_id: string
): Promise<ActionResponse<SerializedOrderWithDetails>> {
  try {
    const shop_id = await authUtils.getOwnedShopId();
    if (!shop_id) {
      throw new UnauthorizedError("Unauthorized: You do not own a shop.");
    }

    const order = await orderRepository.getOrderById(order_id, {
      include: orderWithDetailsInclude,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.shop_id !== shop_id) {
      throw new UnauthorizedError(
        "Unauthorized: This order does not belong to your shop."
      );
    }

    return createSuccessResponse(
      serializeOrderWithDetails(order),
      "Order details retrieved successfully"
    );
  } catch (error) {
    console.error("GET SHOP ORDER BY ID ERROR:", error);
    throw new InternalServerError("Failed to retrieve order details.");
  }
}

export async function batchUpdateOrderStatusAction({
  orderIds,
  status,
}: {
  orderIds: string[];
  status: OrderStatus;
}) {
  try {
    const shop_id = await authUtils.getOwnedShopId();
    if (!shop_id) {
      throw new UnauthorizedError("Unauthorized: You do not own a shop.");
    }

    const orders = await orderRepository.getOrdersByIds(orderIds, {
      select: { id: true, shop_id: true, user_id: true, display_id: true },
    });

    for (const order of orders) {
      if (order.shop_id !== shop_id) {
        throw new UnauthorizedError(
          `Unauthorized: Order ${order.display_id} does not belong to your shop.`
        );
      }
    }

    await orderRepository.batchUpdateStatus(orderIds, status);

    Promise.allSettled(
      orders.map(
        (order) =>
          order.user_id &&
          notificationService.publishNotification(order.user_id, {
            title: "Order Status Updated",
            message: `Your order with ID: ${order.display_id} has been updated to ${status.replaceAll("_", " ")}`,
            action_url: getOrderUrl(order.id),
            type: "INFO",
          })
      )
    );

    return createSuccessResponse(
      null,
      `Successfully updated ${orderIds.length} orders to ${status}`
    );
  } catch (error) {
    console.error("BATCH UPDATE ORDER STATUS ERROR:", error);
    throw new InternalServerError("Failed to update order statuses.");
  }
}
