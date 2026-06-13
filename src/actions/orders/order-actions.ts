"use server";
import { VALID_ORDER_TRANSITIONS } from "@/config/constants";
import { notificationService, orderService } from "@/di/container";
import { OrderStatus, PaymentMethod } from "@/generated/client";
import {
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import {
  orderWithDetailsInclude,
  serializeOrder,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import { getOrderUrl } from "@/lib/utils/url.utils";
import orderRepository from "@/repositories/order.repository";
import { shopRepository } from "@/repositories/shop.repository";
import { SerializedOrderWithDetails } from "@/types";
import {
  ActionResponse,
  createSuccessResponse,
  PaginatedResponse,
} from "@/types/response.types";
import { validateDeliveryTime } from "@/validations/order.validation";
const log = createLogger("order-actions");

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

    const { orders, total_pages, currentPage } = await orderService.getOrders({
      ...queryOptions,
      userId,
    });

    return createSuccessResponse(
      {
        data: orders.map(serializeOrderWithDetails),
        total_pages,
        currentPage,
      },
      "Orders retrieved successfully"
    );
  } catch (error) {
    log.error({ err: error }, "GET ORDERS ERROR:");
    throw new InternalServerError("Failed to retrieve orders.");
  }
}

export async function createOrderAction({
  shop_id,
  payment_method,
  delivery_address_id,
  requested_delivery_time,
  upi_transaction_id,
  customer_notes,
  is_direct_delivery,
  batch_id,
}: {
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  requested_delivery_time?: Date;
  upi_transaction_id?: string;
  customer_notes?: string;
  is_direct_delivery?: boolean;
  batch_id?: string;
}) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const shop = await shopRepository.findById(shop_id);
    if (!shop) {
      throw new ValidationError("Shop not found or no longer available.");
    }
    if (!shop.is_active) {
      throw new ValidationError("Shop is currently not accepting orders.");
    }
    if (!shop.accepting_orders) {
      throw new ValidationError(
        "Shop is not accepting orders at the moment. Please try again later."
      );
    }

    if (requested_delivery_time) {
      const deliveryTime = new Date(requested_delivery_time);
      if (isNaN(deliveryTime.getTime())) {
        throw new ValidationError("Invalid delivery time.");
      }

      const validationError = validateDeliveryTime(
        deliveryTime,
        shop.opening,
        shop.closing
      );
      if (validationError) {
        throw new ValidationError(validationError);
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
      upi_transaction_id,
      customer_notes,
      is_direct_delivery,
      batch_id
    );

    return createSuccessResponse(
      serializeOrder(order),
      "Order placed successfully!"
    );
  } catch (error) {
    log.error({ err: error }, "CREATE ORDER ERROR:");
    if (error instanceof ValidationError) {
      throw error;
    }
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
        payment_method: true,
      },
    });
    if (!order || order.shop_id !== shop_id) {
      throw new UnauthorizedError(
        "Unauthorized: Order does not belong to your shop."
      );
    }

    const allowedStatuses =
      VALID_ORDER_TRANSITIONS[
        order.order_status as keyof typeof VALID_ORDER_TRANSITIONS
      ] || [];
    if (!allowedStatuses.includes(status as never)) {
      throw new ValidationError(
        `Invalid status transition from ${order.order_status} to ${status}`
      );
    }

    const paymentStatus =
      status === "COMPLETED"
        ? order.payment_method === "CASH"
          ? "COMPLETED"
          : undefined
        : status === "CANCELLED"
          ? order.payment_method === "ONLINE"
            ? "REFUNDED"
            : "CANCELLED"
          : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id: order_id },
      data: {
        order_status: status,
        payment_status: paymentStatus,
        actual_delivery_time: status === "COMPLETED" ? new Date() : undefined,
      },
    });

    if (order.user_id) {
      try {
        let title = "Order Status Updated";
        let message = `Your order with ID: ${order.display_id} has been updated to ${status.replaceAll("_", " ")}`;
        let type: "INFO" | "SUCCESS" | "ERROR" | "WARNING" = "INFO";

        if (status === "COMPLETED") {
          title = "🎉 Order Delivered!";
          message = `Your order ${order.display_id} was successfully delivered. Thank you!`;
          type = "SUCCESS";
        } else if (status === "CANCELLED") {
          title = "❌ Order Cancelled";
          message = `Your order ${order.display_id} has been cancelled.`;
          type = "ERROR";
        } else if (status === "OUT_FOR_DELIVERY") {
          title = "🚀 Order Out for Delivery!";
          message = `Your order ${order.display_id} is out for delivery.`;
          type = "SUCCESS";
        }

        await notificationService.publishNotification(order.user_id, {
          title,
          message,
          action_url: getOrderUrl(order_id),
          type,
          category: "ORDER",
        });
      } catch (error) {
        log.error({ err: error }, "Notification Error:");
      }
    }

    return createSuccessResponse(
      { ...updatedOrder, total_price: Number(updatedOrder.total_price) },
      `Order status updated to ${status}`
    );
  } catch (error) {
    log.error({ err: error }, "UPDATE ORDER STATUS ERROR:");
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
    log.error({ err: error }, "GET ORDER BY ID ERROR:");
    throw new InternalServerError("Failed to retrieve order details.");
  }
}

export async function cancelOrderAction(
  order_id: string
): Promise<ActionResponse<null>> {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const order = await orderRepository.getOrderById(order_id, {
      select: {
        id: true,
        user_id: true,
        display_id: true,
        order_status: true,
        payment_status: true,
      },
    });

    if (!order) {
      throw new ValidationError("Order not found.");
    }

    if (order.user_id !== user_id) {
      throw new UnauthorizedError(
        "Unauthorized: This order doesn't belong to you."
      );
    }

    if (order.order_status !== "NEW") {
      throw new ValidationError(
        "Only orders with status NEW can be cancelled."
      );
    }

    if (order.payment_status === "COMPLETED") {
      throw new ValidationError(
        "Cannot cancel an order with completed payment. Please contact support."
      );
    }

    await orderRepository.updateStatus(order_id, OrderStatus.CANCELLED);

    try {
      await notificationService.publishNotification(user_id, {
        title: "Order Cancelled",
        message: `Your order ${order.display_id} has been cancelled.`,
        action_url: getOrderUrl(order_id),
        type: "WARNING",
      });
    } catch (error) {
      log.error({ err: error }, "Notification Error:");
    }

    return createSuccessResponse(null, "Order cancelled successfully.");
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    log.error({ err: error }, "CANCEL ORDER ERROR:");
    throw new InternalServerError("Failed to cancel order.");
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
    log.error({ err: error }, "GET SHOP ORDER BY ID ERROR:");
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
      select: {
        id: true,
        shop_id: true,
        user_id: true,
        display_id: true,
        order_status: true,
        payment_method: true,
      },
    });

    const invalidTransitions: string[] = [];
    for (const order of orders) {
      if (order.shop_id !== shop_id) {
        throw new UnauthorizedError(
          `Unauthorized: Order ${order.display_id} does not belong to your shop.`
        );
      }

      if (order.order_status === status) {
        continue;
      }

      const allowedStatuses =
        VALID_ORDER_TRANSITIONS[
          order.order_status as keyof typeof VALID_ORDER_TRANSITIONS
        ] || [];
      if (!allowedStatuses.includes(status as never)) {
        invalidTransitions.push(
          `${order.display_id}: ${order.order_status} → ${status}`
        );
      }
    }

    if (invalidTransitions.length > 0) {
      throw new ValidationError(
        `Invalid status transitions: ${invalidTransitions.join(", ")}`
      );
    }

    const ordersToUpdate = orders.filter((o) => o.order_status !== status);

    if (ordersToUpdate.length > 0) {
      await prisma.$transaction(
        ordersToUpdate.map((o) => {
          const paymentStatus =
            status === "COMPLETED"
              ? o.payment_method === "CASH"
                ? "COMPLETED"
                : undefined
              : status === "CANCELLED"
                ? o.payment_method === "ONLINE"
                  ? "REFUNDED"
                  : "CANCELLED"
                : undefined;

          return prisma.order.update({
            where: { id: o.id },
            data: {
              order_status: status,
              payment_status: paymentStatus,
              actual_delivery_time:
                status === "COMPLETED" ? new Date() : undefined,
            },
          });
        })
      );
    }

    Promise.allSettled(
      orders.map((order) => {
        if (!order.user_id) return Promise.resolve();

        let title = "Order Status Updated";
        let message = `Your order with ID: ${order.display_id} has been updated to ${status.replaceAll("_", " ")}`;
        let type: "INFO" | "SUCCESS" | "ERROR" | "WARNING" = "INFO";

        if (status === "COMPLETED") {
          title = "🎉 Order Delivered!";
          message = `Your order ${order.display_id} was successfully delivered. Thank you!`;
          type = "SUCCESS";
        } else if (status === "CANCELLED") {
          title = "❌ Order Cancelled";
          message = `Your order ${order.display_id} has been cancelled.`;
          type = "ERROR";
        } else if (status === "OUT_FOR_DELIVERY") {
          title = "🚀 Order Out for Delivery!";
          message = `Your order ${order.display_id} is out for delivery.`;
          type = "SUCCESS";
        }

        return notificationService.publishNotification(order.user_id, {
          title,
          message,
          action_url: getOrderUrl(order.id),
          type,
          category: "ORDER",
        });
      })
    );

    return createSuccessResponse(
      null,
      `Successfully updated ${orderIds.length} orders to ${status}`
    );
  } catch (error) {
    log.error({ err: error }, "BATCH UPDATE ORDER STATUS ERROR:");
    throw new InternalServerError("Failed to update order statuses.");
  }
}
