// Internal order-status helpers for the order server actions.
// NOTE: deliberately NOT a "use server" module.

import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/client";

type NotificationType = "INFO" | "SUCCESS" | "ERROR" | "WARNING";

/**
 * Payment status to store when an order moves to `status`: cash orders are
 * paid on completion; cancelled orders are refunded when already paid (or
 * paid online), otherwise cancelled; any other transition leaves the payment
 * status untouched (undefined).
 */
export function paymentStatusForTransition(
  status: OrderStatus,
  paymentMethod: PaymentMethod | string,
  currentPaymentStatus?: PaymentStatus | string | null
): "COMPLETED" | "REFUNDED" | "CANCELLED" | undefined {
  if (status === "COMPLETED") {
    return paymentMethod === "CASH" ? "COMPLETED" : undefined;
  }
  if (status === "CANCELLED") {
    return paymentMethod === "ONLINE" || currentPaymentStatus === "COMPLETED"
      ? "REFUNDED"
      : "CANCELLED";
  }
  return undefined;
}

/** Customer-facing notification content for an order moved to `status`. */
export function orderStatusNotification(
  status: OrderStatus,
  displayId: string
): { title: string; message: string; type: NotificationType } {
  switch (status) {
    case "COMPLETED":
      return {
        title: "🎉 Order Delivered!",
        message: `Your order ${displayId} was successfully delivered. Thank you!`,
        type: "SUCCESS",
      };
    case "CANCELLED":
      return {
        title: "❌ Order Cancelled",
        message: `Your order ${displayId} has been cancelled.`,
        type: "ERROR",
      };
    case "OUT_FOR_DELIVERY":
      return {
        title: "🚀 Order Out for Delivery!",
        message: `Your order ${displayId} is out for delivery.`,
        type: "SUCCESS",
      };
    default:
      return {
        title: "Order Status Updated",
        message: `Your order with ID: ${displayId} has been updated to ${status.replaceAll("_", " ")}`,
        type: "INFO",
      };
  }
}
