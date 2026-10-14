"use server";

import z from "zod";

import {
  batchRepository,
  notificationService,
  orderRepository,
} from "@/di/container";
import { OrderStatus, PaymentStatus, Prisma } from "@/generated/client";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import { getOrderUrl } from "@/lib/utils/url.utils";
import { SerializedOrderWithDetails } from "@/types";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { cursorArgs, runAdminAction, toCursorPage } from "./_shared";
const log = createLogger("order-actions");

const getAllOrderSchema = searchSchema.extend({
  order_status: z.enum(OrderStatus).optional(),
  payment_status: z.enum(PaymentStatus).optional(),
  shop_id: z.string().optional(),
});

export async function getAllOrdersAction(
  options: z.infer<typeof getAllOrderSchema>
): Promise<
  ActionResponse<CursorPaginatedResponse<SerializedOrderWithDetails>>
> {
  return runAdminAction(
    log,
    {
      label: "GET ALL ORDERS ERROR:",
      fallback: "Failed to retrieve orders.",
    },
    async () => {
      const parsedData = getAllOrderSchema.safeParse(options);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid options");
      }
      const { limit, cursor, search, order_status, payment_status, shop_id } =
        parsedData.data;

      const where: Prisma.OrderWhereInput | undefined = {};

      if (search) {
        where.OR = [
          { display_id: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          {
            user: { email: { contains: search, mode: "insensitive" } },
          },
        ];
      }

      if (order_status) {
        where.order_status = order_status;
      }

      if (payment_status) {
        where.payment_status = payment_status;
      }

      if (shop_id) {
        where.shop_id = shop_id;
      }

      const orders = await orderRepository.findMany({
        where,
        ...cursorArgs(limit, cursor),
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        include: orderWithDetailsInclude,
      });

      const { data, nextCursor, hasMore } = toCursorPage(orders, limit);

      return createSuccessResponse(
        {
          data: data.map(serializeOrderWithDetails),
          nextCursor,
          hasMore,
        },
        "Orders retrieved successfully"
      );
    }
  );
}

const updateOrderSchema = z.object({
  order_id: z.string(),
  order_status: z.enum(OrderStatus),
  estimated_delivery_time: z.date().optional(),
});

export async function updateOrderStatusAdminAction(
  data: z.infer<typeof updateOrderSchema>
): Promise<
  ActionResponse<{
    id: string;
    display_id: string;
    order_status: OrderStatus;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "UPDATE ORDER STATUS ERROR:",
      fallback: "Failed to update order status.",
      passthrough: [NotFoundError],
    },
    async () => {
      const parsedData = updateOrderSchema.safeParse(data);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid Input.");
      }
      const { order_id, order_status, estimated_delivery_time } =
        parsedData.data;

      const order = await orderRepository.findById(order_id, {
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
        order_status,
      };

      if (
        order_status === OrderStatus.OUT_FOR_DELIVERY &&
        estimated_delivery_time
      ) {
        updateData.estimated_delivery_time = estimated_delivery_time;
      } else if (order_status === OrderStatus.COMPLETED) {
        updateData.actual_delivery_time = new Date();
      }

      // Cancelling removes the order's item_total from its batch's collective
      // total; reverting a cancelled order to an active status adds it back.
      const wasCancelled = order.order_status === OrderStatus.CANCELLED;
      const isCancelled = order_status === OrderStatus.CANCELLED;
      const itemTotal = Number(order.item_total);
      const batchDelta =
        isCancelled && !wasCancelled
          ? -itemTotal
          : wasCancelled && !isCancelled
            ? itemTotal
            : 0;

      const { result: updatedOrder, updatedBatch } = await prisma.$transaction(
        async (tx) => {
          const result = await tx.order.update({
            where: { id: order_id },
            data: updateData,
          });
          const updatedBatch =
            batchDelta !== 0 && order.batch_id
              ? await batchRepository.adjustCollectiveTotal(
                  order.batch_id,
                  batchDelta,
                  tx
                )
              : null;
          return { result, updatedBatch };
        }
      );

      if (updatedBatch) {
        await publishBatchProgress({
          batchId: updatedBatch.id,
          shopId: updatedBatch.shop_id,
          status: updatedBatch.status,
          collectiveTotal: Number(updatedBatch.collective_total),
          minRequired:
            updatedBatch.min_order_value_snapshot !== null
              ? Number(updatedBatch.min_order_value_snapshot)
              : null,
        });
      }

      const statusMessages: Record<OrderStatus, string> = {
        NEW: "has been received",
        BATCHED: "is being prepared",
        OUT_FOR_DELIVERY: "is out for delivery",
        DELIVERY_FAILED: "failed to be delivered",
        COMPLETED: "has been completed",
        CANCELLED: "has been cancelled",
        RESCHEDULED: "has been rescheduled",
      };

      if (order.user_id) {
        await notificationService.publishNotification(order.user_id, {
          title: "Order Status Updated",
          message: `Your order #${order.display_id} ${statusMessages[order_status]}.`,
          type:
            order_status === "COMPLETED"
              ? "SUCCESS"
              : order_status === "CANCELLED"
                ? "ERROR"
                : "INFO",
          category: "ORDER",
          action_url: getOrderUrl(order.id),
        });
      }

      return createSuccessResponse(
        {
          id: updatedOrder.id,
          display_id: updatedOrder.display_id,
          order_status: updatedOrder.order_status,
        },
        `Successfully updated order #${updatedOrder.display_id} status to ${order_status}`
      );
    }
  );
}

const updatePaymentStatusSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  payment_status: z.enum(PaymentStatus),
});

export async function updatePaymentStatusAction(
  data: z.infer<typeof updatePaymentStatusSchema>
): Promise<
  ActionResponse<{
    id: string;
    display_id: string;
    payment_status: PaymentStatus;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "UPDATE PAYMENT STATUS ERROR:",
      fallback: "Failed to update payment status.",
      passthrough: [NotFoundError],
    },
    async () => {
      const parsedData = updatePaymentStatusSchema.safeParse(data);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid Input.");
      }
      const { order_id, payment_status } = parsedData.data;
      const order = await orderRepository.findById(order_id, {
        include: {
          user: true,
        },
      });

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      const updatedOrder = await orderRepository.update(order_id, {
        payment_status,
      });

      if (order.user_id) {
        await notificationService.publishNotification(order.user_id, {
          title: "Payment Status Updated",
          message: `Payment status for order #${order.display_id} has been updated to ${payment_status}.`,
          type:
            payment_status === "COMPLETED"
              ? "SUCCESS"
              : payment_status === "FAILED"
                ? "ERROR"
                : "INFO",
          category: "ORDER",
          action_url: getOrderUrl(order.id),
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
    }
  );
}

/**
 * Get order statistics
 */
export async function getOrderStatsAction(): Promise<
  ActionResponse<{
    totalOrders: number;
    newOrders: number;
    batchedOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingPayments: number;
    recentOrders: number;
    todayRevenue: number;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "GET ORDER STATS ERROR:",
      fallback: "Failed to retrieve order statistics.",
    },
    async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [
        totalOrders,
        newOrders,
        batchedOrders,
        completedOrders,
        cancelledOrders,
        pendingPayments,
        recentOrders,
        todayOrders,
      ] = await Promise.all([
        orderRepository.count(),
        orderRepository.count({ where: { order_status: OrderStatus.NEW } }),
        orderRepository.count({ where: { order_status: OrderStatus.BATCHED } }),
        orderRepository.count({
          where: { order_status: OrderStatus.COMPLETED },
        }),
        orderRepository.count({
          where: { order_status: OrderStatus.CANCELLED },
        }),
        orderRepository.count({
          where: { payment_status: PaymentStatus.PENDING },
        }),
        orderRepository.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
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
          batchedOrders,
          completedOrders,
          cancelledOrders,
          pendingPayments,
          recentOrders,
          todayRevenue,
        },
        "Order statistics retrieved successfully"
      );
    }
  );
}
