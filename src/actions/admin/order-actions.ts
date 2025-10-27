"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import orderRepository from "@/repositories/order.repository";
import notificationService from "@/services/notification.service";
import { SerializedOrderWithDetails } from "@/types";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";

import { verifyAdmin } from "../authentication/admin";

export async function getAllOrdersAction(options: {
  limit?: number;
  cursor?: string;
  search?: string;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  shop_id?: string;
}): Promise<
  ActionResponse<CursorPaginatedResponse<SerializedOrderWithDetails>>
> {
  try {
    await verifyAdmin();

    const limit = options.limit || 20;
    const where: Prisma.OrderWhereInput | undefined = {};

    if (options.search) {
      where.OR = [
        { display_id: { contains: options.search, mode: "insensitive" } },
        { user: { name: { contains: options.search, mode: "insensitive" } } },
        {
          user: { email: { contains: options.search, mode: "insensitive" } },
        },
      ];
    }

    if (options.order_status) {
      where.order_status = options.order_status;
    }

    if (options.payment_status) {
      where.payment_status = options.payment_status;
    }

    if (options.shop_id) {
      where.shop_id = options.shop_id;
    }

    const orders = await orderRepository.findMany({
      where,
      take: limit + 1,
      skip: options.cursor ? 1 : 0,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      orderBy: { created_at: "desc" },
      include: orderWithDetailsInclude,
    });

    const hasMore = orders.length > limit;
    const data = hasMore ? orders.slice(0, -1) : orders;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return createSuccessResponse(
      {
        data: data.map(serializeOrderWithDetails),
        nextCursor,
        hasMore,
      },
      "Orders retrieved successfully"
    );
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve orders.");
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  orderStatus: OrderStatus,
  estimatedDeliveryTime?: Date
): Promise<
  ActionResponse<{
    id: string;
    display_id: string;
    order_status: OrderStatus;
  }>
> {
  try {
    await verifyAdmin();

    const order = await orderRepository.findById(orderId, {
      include: {
        user: true,
        shop: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const updateData: {
      order_status: OrderStatus;
      estimated_delivery_time?: Date;
      actual_delivery_time?: Date;
    } = {
      order_status: orderStatus,
    };

    if (orderStatus === OrderStatus.OUT_FOR_DELIVERY && estimatedDeliveryTime) {
      updateData.estimated_delivery_time = estimatedDeliveryTime;
    } else if (orderStatus === OrderStatus.COMPLETED) {
      updateData.actual_delivery_time = new Date();
    }

    const updatedOrder = await orderRepository.update(orderId, updateData);

    const statusMessages: Record<OrderStatus, string> = {
      NEW: "has been received",
      PREPARING: "is being prepared",
      READY_FOR_PICKUP: "is ready for pickup",
      OUT_FOR_DELIVERY: "is out for delivery",
      COMPLETED: "has been completed",
      CANCELLED: "has been cancelled",
    };

    if (order.user_id) {
      await notificationService.publishNotification(order.user_id, {
        title: "Order Status Updated",
        message: `Your order #${order.display_id} ${statusMessages[orderStatus]}.`,
        type:
          orderStatus === "COMPLETED"
            ? "SUCCESS"
            : orderStatus === "CANCELLED"
              ? "ERROR"
              : "INFO",
        category: "ORDER",
        action_url: `/orders/${order.id}`,
      });
    }

    return createSuccessResponse(
      {
        id: updatedOrder.id,
        display_id: updatedOrder.display_id,
        order_status: updatedOrder.order_status,
      },
      `Successfully updated order #${updatedOrder.display_id} status to ${orderStatus}`
    );
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update order status.");
  }
}

export async function updatePaymentStatusAction(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<
  ActionResponse<{
    id: string;
    display_id: string;
    payment_status: PaymentStatus;
  }>
> {
  try {
    await verifyAdmin();

    const order = await orderRepository.findById(orderId, {
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const updatedOrder = await orderRepository.update(orderId, {
      payment_status: paymentStatus,
    });

    if (order.user_id) {
      await notificationService.publishNotification(order.user_id, {
        title: "Payment Status Updated",
        message: `Payment status for order #${order.display_id} has been updated to ${paymentStatus}.`,
        type:
          paymentStatus === "COMPLETED"
            ? "SUCCESS"
            : paymentStatus === "FAILED"
              ? "ERROR"
              : "INFO",
        category: "ORDER",
        action_url: `/orders/${order.id}`,
      });
    }

    return createSuccessResponse(
      {
        id: updatedOrder.id,
        display_id: updatedOrder.display_id,
        payment_status: updatedOrder.payment_status,
      },
      `Successfully updated payment status for order #${updatedOrder.display_id}`
    );
  } catch (error) {
    console.error("UPDATE PAYMENT STATUS ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update payment status.");
  }
}

/**
 * Get order statistics
 */
export async function getOrderStatsAction(): Promise<
  ActionResponse<{
    totalOrders: number;
    newOrders: number;
    preparingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingPayments: number;
    recentOrders: number;
    todayRevenue: number;
  }>
> {
  try {
    await verifyAdmin();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      newOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders,
      pendingPayments,
      recentOrders,
      todayOrders,
    ] = await Promise.all([
      orderRepository.count({}),
      orderRepository.count({ order_status: OrderStatus.NEW }),
      orderRepository.count({ order_status: OrderStatus.PREPARING }),
      orderRepository.count({ order_status: OrderStatus.COMPLETED }),
      orderRepository.count({ order_status: OrderStatus.CANCELLED }),
      orderRepository.count({ payment_status: PaymentStatus.PENDING }),
      orderRepository.count({
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      }),
      orderRepository.findMany({
        where: {
          created_at: {
            gte: startOfDay,
          },
          order_status: OrderStatus.COMPLETED,
        },
        select: {
          total_price: true,
        },
      }),
    ]);

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + Number(order.total_price),
      0
    );

    return createSuccessResponse(
      {
        totalOrders,
        newOrders,
        preparingOrders,
        completedOrders,
        cancelledOrders,
        pendingPayments,
        recentOrders,
        todayRevenue,
      },
      "Order statistics retrieved successfully"
    );
  } catch (error) {
    console.error("GET ORDER STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve order statistics.");
  }
}
