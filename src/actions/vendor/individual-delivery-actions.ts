"use server";

import {
  generateDeliveryOtp,
  publishBatchRowProgress,
  requireOwnedShopId,
} from "@/actions/_shared/action-helpers";
import { verifyOrderOtpAction } from "@/actions/vendor/batch-actions";
import { VALID_ORDER_TRANSITIONS } from "@/config/constants";
import { batchRepository, notificationService } from "@/di/container";
import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse } from "@/types";
const log = createLogger("individual-delivery-actions");

export async function startIndividualDeliveryAction(orderId: string) {
  const shopId = await requireOwnedShopId();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shop_id: true,
      order_status: true,
      delivery_otp: true,
      user_id: true,
      display_id: true,
      batch_id: true,
      item_total: true,
    },
  });

  if (!order || order.shop_id !== shopId) {
    throw new UnauthorizedError("Order not found or unauthorized");
  }

  // Only statuses whose allowed transitions include OUT_FOR_DELIVERY
  // (an accepted or rescheduled order) can be sent out for delivery.
  const next: readonly string[] =
    VALID_ORDER_TRANSITIONS[order.order_status] ?? [];
  if (!next.includes("OUT_FOR_DELIVERY")) {
    throw new ValidationError("This order can’t be delivered.");
  }

  const otp = order.delivery_otp || generateDeliveryOtp();

  // Delivering a batch order on its own takes it out of the batch (it becomes
  // a direct delivery): otherwise the batch run would later rewrite its
  // status and OTP, and it would still count towards the batch total.
  const updatedBatch = await prisma.$transaction(async (tx) => {
    // Pinned to the validated status so a concurrent change isn't overwritten.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, order_status: order.order_status },
      data: {
        order_status: "OUT_FOR_DELIVERY",
        delivery_otp: otp,
        ...(order.batch_id && { batch_id: null, is_direct_delivery: true }),
      },
    });
    if (count === 0) {
      throw new ValidationError(
        "This order was updated by someone else. Refresh and try again."
      );
    }
    return order.batch_id
      ? batchRepository.adjustCollectiveTotal(
          order.batch_id,
          -Number(order.item_total),
          tx
        )
      : null;
  });

  await publishBatchRowProgress(updatedBatch);

  if (order.user_id) {
    try {
      await notificationService.publishNotification(order.user_id, {
        title: "🚀 Order Out for Delivery!",
        message: `Your order ${order.display_id} is out for delivery. Share OTP ${otp} to complete delivery.`,
        type: "SUCCESS",
        category: "ORDER",
        action_url: `/orders/${orderId}`,
      });
    } catch (notifyErr) {
      log.error(
        `Failed to send individual delivery notification:
        ${notifyErr}`
      );
    }
  }

  return createSuccessResponse(null, "Order marked as OUT_FOR_DELIVERY.");
}

export async function verifyIndividualOrderOtpAction(
  orderId: string,
  otp: string
) {
  return verifyOrderOtpAction(orderId, otp);
}
