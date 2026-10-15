"use server";
import {
  AUTH_ERRORS,
  notifyUserSafely,
  publishBatchRowProgress,
  requireOwnedShopId,
  requireUserId,
  runAction,
} from "@/actions/_shared/action-helpers";
import {
  orderStatusNotification,
  paymentStatusForTransition,
} from "@/actions/orders/order-status";
import { VALID_ORDER_TRANSITIONS } from "@/config/constants";
import {
  batchRepository,
  orderRepository,
  orderService,
  shopRepository,
} from "@/di/container";
import { OrderStatus, PaymentMethod } from "@/generated/client";
import {
  NotFoundError,
  UnauthenticatedError,
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
import { SerializedOrderWithDetails } from "@/types";
import {
  ActionResponse,
  createErrorResponse,
  createSuccessResponse,
  PaginatedResponse,
} from "@/types/response.types";
import {
  upiTransactionIdSchema,
  validateDeliveryTime,
} from "@/validations/order.validation";
const log = createLogger("order-actions");

const STATUS_ERRORS = [ValidationError, ...AUTH_ERRORS];
const LOOKUP_ERRORS = [NotFoundError, ...AUTH_ERRORS];

function allowedTransitions(from: string): readonly string[] {
  return (
    VALID_ORDER_TRANSITIONS[from as keyof typeof VALID_ORDER_TRANSITIONS] || []
  );
}

export async function getOrdersAction(options: {
  page?: number;
  limit?: number;
}): Promise<ActionResponse<PaginatedResponse<SerializedOrderWithDetails>>> {
  return runAction(
    log,
    {
      label: "GET ORDERS ERROR:",
      fallback: "Failed to retrieve orders.",
      passthrough: AUTH_ERRORS,
    },
    async () => {
      const userId = await requireUserId();
      const { orders, total_pages, currentPage } = await orderService.getOrders(
        {
          page: options.page || 1,
          limit: options.limit || 10,
          userId,
        }
      );

      return createSuccessResponse(
        {
          data: orders.map(serializeOrderWithDetails),
          total_pages,
          currentPage,
        },
        "Orders retrieved successfully"
      );
    }
  );
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
      return createErrorResponse("Unauthorized: Please log in.");
    }

    const shop = await shopRepository.findById(shop_id);
    if (!shop) {
      return createErrorResponse("Shop not found or no longer available.");
    }
    if (!shop.is_active) {
      return createErrorResponse("Shop is currently not accepting orders.");
    }
    if (!shop.accepting_orders) {
      return createErrorResponse(
        "Shop is not accepting orders at the moment. Please try again later."
      );
    }

    if (
      payment_method === "ONLINE" &&
      (!upi_transaction_id ||
        !upiTransactionIdSchema.safeParse(upi_transaction_id).success)
    ) {
      return createErrorResponse(
        "A valid UPI transaction ID (10-35 letters or digits) is required for online payment."
      );
    }

    let deliveryTime: Date | undefined = undefined;

    if (!is_direct_delivery && requested_delivery_time) {
      deliveryTime = new Date(requested_delivery_time);
      if (isNaN(deliveryTime.getTime())) {
        return createErrorResponse("Invalid delivery time.");
      }

      const validationError = validateDeliveryTime(
        deliveryTime,
        shop.opening,
        shop.closing
      );
      if (validationError) {
        return createErrorResponse(validationError);
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
      is_direct_delivery ? undefined : deliveryTime,
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
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof UnauthenticatedError
    ) {
      return createErrorResponse(error.message);
    }
    // Like runAction: unexpected failures never leak internal messages.
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
  return runAction(
    log,
    {
      label: "UPDATE ORDER STATUS ERROR:",
      fallback: "Failed to update order status.",
      passthrough: STATUS_ERRORS,
    },
    async () => {
      const shop_id = await authUtils.getOwnedShopId();

      const order = await orderRepository.getOrderById(order_id, {
        select: {
          shop_id: true,
          user_id: true,
          display_id: true,
          order_status: true,
          payment_method: true,
          payment_status: true,
          batch_id: true,
          item_total: true,
        },
      });
      if (!order || order.shop_id !== shop_id) {
        throw new UnauthorizedError(
          "Unauthorized: Order does not belong to your shop."
        );
      }

      if (!allowedTransitions(order.order_status).includes(status)) {
        throw new ValidationError(
          `Invalid status transition from ${order.order_status} to ${status}`
        );
      }

      const paymentStatus = paymentStatusForTransition(
        status,
        order.payment_method,
        order.payment_status
      );

      const { result: updatedOrder, updatedBatch } = await prisma.$transaction(
        async (tx) => {
          const result = await tx.order.update({
            where: { id: order_id },
            data: {
              order_status: status,
              payment_status: paymentStatus,
              actual_delivery_time:
                status === "COMPLETED" ? new Date() : undefined,
            },
          });
          const updatedBatch =
            // A CANCELLED order has no allowed transitions, so this always
            // removes a still-counted order from its batch total.
            status === "CANCELLED" && order.batch_id
              ? await batchRepository.adjustCollectiveTotal(
                  order.batch_id,
                  -Number(order.item_total),
                  tx
                )
              : null;
          return { result, updatedBatch };
        }
      );

      await publishBatchRowProgress(updatedBatch);

      await notifyUserSafely(
        log,
        order.user_id,
        {
          ...orderStatusNotification(status, order.display_id),
          action_url: getOrderUrl(order_id),
          category: "ORDER",
        },
        "Notification Error:"
      );

      return createSuccessResponse(
        { ...updatedOrder, total_price: Number(updatedOrder.total_price) },
        `Order status updated to ${status}`
      );
    }
  );
}

export async function getOrderByIdAction(
  order_id: string
): Promise<ActionResponse<SerializedOrderWithDetails>> {
  return runAction(
    log,
    {
      label: "GET ORDER BY ID ERROR:",
      fallback: "Failed to retrieve order details.",
      passthrough: LOOKUP_ERRORS,
    },
    async () => {
      const user_id = await requireUserId();

      const order = await orderRepository.getOrderById(order_id, {
        include: orderWithDetailsInclude,
      });

      // A missing order and an order that exists but belongs to someone
      // else are deliberately indistinguishable here - a separate branch
      // per case would let the response act as an existence oracle for
      // orders the caller doesn't own.
      if (!order || order.user_id !== user_id) {
        throw new NotFoundError("Order not found.");
      }

      return createSuccessResponse(
        serializeOrderWithDetails(order),
        "Order details retrieved successfully"
      );
    }
  );
}

export async function cancelOrderAction(
  order_id: string
): Promise<ActionResponse<null>> {
  return runAction(
    log,
    {
      label: "CANCEL ORDER ERROR:",
      fallback: "Failed to cancel order.",
      passthrough: STATUS_ERRORS,
    },
    async () => {
      const user_id = await requireUserId();

      const order = await orderRepository.getOrderById(order_id, {
        select: {
          id: true,
          user_id: true,
          display_id: true,
          order_status: true,
          payment_status: true,
          payment_method: true,
          batch_id: true,
          item_total: true,
        },
      });

      // A missing order and an order that exists but belongs to someone
      // else are deliberately indistinguishable here - a separate branch
      // per case would let the response act as an existence oracle for
      // orders the caller doesn't own. Matches the single-branch pattern
      // updateOrderStatusAction already uses.
      if (!order || order.user_id !== user_id) {
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

      const updatedBatch = await prisma.$transaction(async (tx) => {
        await orderRepository.update(
          order_id,
          {
            order_status: OrderStatus.CANCELLED,
            payment_status: paymentStatusForTransition(
              OrderStatus.CANCELLED,
              order.payment_method,
              order.payment_status
            ),
          },
          undefined,
          tx
        );
        if (order.batch_id) {
          return batchRepository.adjustCollectiveTotal(
            order.batch_id,
            -Number(order.item_total),
            tx
          );
        }
        return null;
      });

      await publishBatchRowProgress(updatedBatch);

      await notifyUserSafely(
        log,
        user_id,
        {
          title: "Order Cancelled",
          message: `Your order ${order.display_id} has been cancelled.`,
          action_url: getOrderUrl(order_id),
          type: "WARNING",
        },
        "Notification Error:"
      );

      return createSuccessResponse(null, "Order cancelled successfully.");
    }
  );
}

export async function getShopOrderByIdAction(
  order_id: string
): Promise<ActionResponse<SerializedOrderWithDetails>> {
  return runAction(
    log,
    {
      label: "GET SHOP ORDER BY ID ERROR:",
      fallback: "Failed to retrieve order details.",
      passthrough: LOOKUP_ERRORS,
    },
    async () => {
      const shop_id = await requireOwnedShopId();

      const order = await orderRepository.getOrderById(order_id, {
        include: orderWithDetailsInclude,
      });

      // A missing order and an order that exists but belongs to a
      // different shop are deliberately indistinguishable here - a
      // separate branch per case would let the response act as an
      // existence oracle for orders the caller's shop doesn't own.
      if (!order || order.shop_id !== shop_id) {
        throw new NotFoundError("Order not found.");
      }

      return createSuccessResponse(
        serializeOrderWithDetails(order),
        "Order details retrieved successfully"
      );
    }
  );
}

export async function batchUpdateOrderStatusAction({
  orderIds,
  status,
}: {
  orderIds: string[];
  status: OrderStatus;
}) {
  return runAction(
    log,
    {
      label: "BATCH UPDATE ORDER STATUS ERROR:",
      fallback: "Failed to update order statuses.",
      passthrough: STATUS_ERRORS,
    },
    async () => {
      const shop_id = await requireOwnedShopId();

      const orders = await orderRepository.getOrdersByIds(orderIds, {
        select: {
          id: true,
          shop_id: true,
          user_id: true,
          display_id: true,
          order_status: true,
          payment_method: true,
          payment_status: true,
          batch_id: true,
          item_total: true,
        },
      });

      const invalidTransitions: string[] = [];
      for (const order of orders) {
        if (order.shop_id !== shop_id) {
          throw new UnauthorizedError(
            "Unauthorized: One or more orders do not belong to your shop."
          );
        }

        if (order.order_status === status) {
          continue;
        }

        if (!allowedTransitions(order.order_status).includes(status)) {
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
      const batchedOrders =
        status === "CANCELLED" ? ordersToUpdate.filter((o) => o.batch_id) : [];

      if (ordersToUpdate.length > 0) {
        await prisma.$transaction([
          ...ordersToUpdate.map((o) =>
            prisma.order.update({
              where: { id: o.id },
              data: {
                order_status: status,
                payment_status: paymentStatusForTransition(
                  status,
                  o.payment_method,
                  o.payment_status
                ),
                actual_delivery_time:
                  status === "COMPLETED" ? new Date() : undefined,
              },
            })
          ),
          ...batchedOrders.map((o) =>
            prisma.batch.update({
              where: { id: o.batch_id! },
              data: {
                collective_total: { decrement: Number(o.item_total) },
              },
            })
          ),
        ]);

        const affectedBatchIds = [
          ...new Set(batchedOrders.map((o) => o.batch_id!)),
        ];
        if (affectedBatchIds.length > 0) {
          const freshBatches = await prisma.batch.findMany({
            where: { id: { in: affectedBatchIds } },
            select: {
              id: true,
              shop_id: true,
              status: true,
              collective_total: true,
              min_order_value_snapshot: true,
            },
          });
          await Promise.all(freshBatches.map(publishBatchRowProgress));
        }
      }

      await Promise.all(
        ordersToUpdate.map((order) =>
          notifyUserSafely(
            log,
            order.user_id,
            {
              ...orderStatusNotification(status, order.display_id),
              action_url: getOrderUrl(order.id),
              category: "ORDER",
            },
            "Notification Error:"
          )
        )
      );

      return createSuccessResponse(
        null,
        `Successfully updated ${ordersToUpdate.length} orders to ${status}`
      );
    }
  );
}
