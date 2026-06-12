"use server";

import { batchService, notificationService } from "@/di/container";
import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types";
const log = createLogger("individual-delivery-actions");

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function startIndividualDeliveryAction(orderId: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shop_id: true,
      order_status: true,
      delivery_otp: true,
      user_id: true,
      display_id: true,
    },
  });

  if (!order || order.shop_id !== shopId) {
    throw new ValidationError("Order not found or unauthorized");
  }

  if (
    order.order_status === "CANCELLED" ||
    order.order_status === "COMPLETED"
  ) {
    throw new ValidationError("This order can’t be delivered.");
  }

  const otp = order.delivery_otp || generateOtp();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      order_status: "OUT_FOR_DELIVERY",
      delivery_otp: otp,
    },
  });

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
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  if (!otp || typeof otp !== "string" || otp.length !== 4) {
    throw new ValidationError("Invalid OTP format. Must be 4 digits.");
  }

  const result = await batchService.verifyOrderOtp(orderId, otp, shopId);
  if (!result.success) {
    throw new ValidationError(result.message);
  }

  return createSuccessResponse(null, result.message);
}
