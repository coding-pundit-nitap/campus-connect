"use server";

import { randomInt } from "node:crypto";

import {
  batchService,
  notificationService,
  orderRepository,
  shopRepository,
} from "@/di/container";
import { Prisma } from "@/generated/client";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types/response.types";
const log = createLogger("order-management-actions");

function generateOtp(): string {
  try {
    return randomInt(1000, 10000).toString().padStart(4, "0");
  } catch {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

export async function acceptOrderAction(orderId: string) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const order = await orderRepository.getOrderById(orderId);
    if (!order || order.shop_id !== shop.id) {
      throw new BadRequestError("Order not found or unauthorized");
    }

    if (order.order_status !== "NEW") {
      throw new BadRequestError(
        `Cannot accept order with status ${order.order_status}`
      );
    }

    // Pre-fetch the next slot in case we need to roll over
    const nextSlot = await batchService.getNextSlot(shop.id);

    const result = await prisma.$transaction(async (tx) => {
      let isRescheduled = false;
      let newBatchId = order.batch_id;
      let isConvertedToDirect = false;

      if (order.batch_id) {
        // Lock the batch row to prevent it from being locked mid-accept
        const lockedBatch = await tx.$queryRaw<
          { id: string; status: string }[]
        >`
          SELECT id, status FROM "Batch" WHERE id = ${order.batch_id} FOR UPDATE
        `;

        if (lockedBatch && lockedBatch.length > 0) {
          if (lockedBatch[0].status !== "OPEN") {
            isRescheduled = true;
            if (nextSlot.batch_id) {
              newBatchId = nextSlot.batch_id;
            } else {
              isConvertedToDirect = true;
              newBatchId = null;
            }
          }
        }
      }

      const updateData: Prisma.OrderUpdateInput = {
        order_status: isRescheduled ? "RESCHEDULED" : "BATCHED",
      };

      if (isRescheduled) {
        if (isConvertedToDirect) {
          updateData.batch = { disconnect: true };
          updateData.is_direct_delivery = true;
          updateData.customer_notes = order.customer_notes
            ? `${order.customer_notes}\n[Auto-converted to Direct Delivery due to missed batch]`
            : "[Auto-converted to Direct Delivery due to missed batch]";
        } else if (newBatchId) {
          updateData.batch = { connect: { id: newBatchId } };
          updateData.customer_notes = order.customer_notes
            ? `${order.customer_notes}\n[Moved to next batch due to missed cutoff]`
            : "[Moved to next batch due to missed cutoff]";
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      return { isRescheduled, isConvertedToDirect, newBatchId };
    });

    if (order.user_id) {
      try {
        if (result.isRescheduled) {
          const msg = result.isConvertedToDirect
            ? `Your order ${order.display_id} missed the batch cutoff and has been upgraded to Direct Delivery for free!`
            : `Your order ${order.display_id} missed the batch cutoff and has been moved to the next available batch.`;

          await notificationService.publishNotification(order.user_id, {
            title: "🕒 Order Rescheduled",
            message: msg,
            type: "WARNING",
            category: "ORDER",
            action_url: `/orders/${orderId}`,
          });
        } else {
          await notificationService.publishNotification(order.user_id, {
            title: "✅ Order Accepted",
            message: `Your order ${order.display_id} has been accepted by the shop and is being prepared.`,
            type: "SUCCESS",
            category: "ORDER",
            action_url: `/orders/${orderId}`,
          });
        }
      } catch (notifyErr) {
        log.error(
          { err: notifyErr },
          "Failed to send order accepted notification:"
        );
      }
    }

    return createSuccessResponse(
      null,
      result.isRescheduled
        ? "Order accepted and rescheduled (missed cutoff)."
        : "Order accepted successfully."
    );
  } catch (error) {
    log.error({ err: error }, "ACCEPT ORDER ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to accept order.");
  }
}

export async function startDirectDeliveryAction(orderId: string) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const order = await orderRepository.getOrderById(orderId);
    if (!order || order.shop_id !== shop.id || !order.is_direct_delivery) {
      throw new BadRequestError("Order not found or unauthorized");
    }

    if (order.order_status !== "BATCHED") {
      throw new BadRequestError(
        `Cannot start delivery for order with status ${order.order_status}`
      );
    }

    const otp = order.delivery_otp || generateOtp();

    await orderRepository.update(orderId, {
      order_status: "OUT_FOR_DELIVERY",
      delivery_otp: otp,
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
        log.error(`Failed to send direct delivery notification: ${notifyErr}`);
      }
    }

    return createSuccessResponse(null, "Direct delivery started.");
  } catch (error) {
    log.error({ err: error }, "START DIRECT DELIVERY ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to start direct delivery.");
  }
}

export async function rejectOrderAction(orderId: string, reason?: string) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const order = await orderRepository.getOrderById(orderId);
    if (!order || order.shop_id !== shop.id) {
      throw new BadRequestError("Order not found or unauthorized");
    }

    if (
      order.order_status === "COMPLETED" ||
      order.order_status === "CANCELLED"
    ) {
      throw new BadRequestError(
        `Cannot reject order with status ${order.order_status}`
      );
    }

    const rejectionNote = reason
      ? `[Vendor Rejected: ${reason}]`
      : "[Vendor Rejected]";

    const paymentStatus =
      order.payment_method === "ONLINE" ? "REFUNDED" : "CANCELLED";

    await orderRepository.update(orderId, {
      order_status: "CANCELLED",
      payment_status: paymentStatus,
      customer_notes: order.customer_notes
        ? `${order.customer_notes}\n${rejectionNote}`
        : rejectionNote,
    });

    if (order.user_id) {
      try {
        await notificationService.publishNotification(order.user_id, {
          title: "❌ Order Rejected by Vendor",
          message: `Your order ${order.display_id} was rejected by the shop. A refund has been initiated if you paid online.`,
          type: "ERROR",
          category: "ORDER",
          action_url: `/orders/${orderId}`,
        });
      } catch (notifyErr) {
        log.error(`Failed to send order rejection notification: ${notifyErr}`);
      }
    }

    return createSuccessResponse(null, "Order rejected successfully.");
  } catch (error) {
    log.error({ err: error }, "REJECT ORDER ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to reject order.");
  }
}

export async function verifyDeliveryOtpAction(orderId: string, otp: string) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const order = await orderRepository.getOrderById(orderId);
    if (!order || order.shop_id !== shop.id) {
      throw new BadRequestError("Order not found or unauthorized");
    }

    if (order.order_status !== "OUT_FOR_DELIVERY") {
      throw new BadRequestError("Order is not in a valid state for delivery.");
    }

    if (!otp || otp.length !== 4) {
      throw new BadRequestError("OTP must be 4 digits.");
    }

    if (order.delivery_otp !== otp) {
      throw new BadRequestError("Invalid OTP provided.");
    }

    await orderRepository.update(orderId, {
      order_status: "COMPLETED",
      actual_delivery_time: new Date(),
      delivery_otp: null,
      payment_status:
        order.payment_method === "CASH" ? "COMPLETED" : order.payment_status,
    });

    if (order.user_id) {
      try {
        await notificationService.publishNotification(order.user_id, {
          title: "🎉 Order Delivered!",
          message: `Your order ${order.display_id} was successfully delivered. Thank you!`,
          type: "SUCCESS",
          category: "ORDER",
          action_url: `/orders/${orderId}`,
        });
      } catch (notifyErr) {
        log.error(
          { err: notifyErr },
          "Failed to send order delivery notification:"
        );
      }
    }

    return createSuccessResponse(null, "OTP verified and order completed.");
  } catch (error) {
    log.error({ err: error }, "VERIFY OTP ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to verify OTP.");
  }
}

export async function markDeliveryFailedAction(
  orderId: string,
  reason: string
) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const order = await orderRepository.getOrderById(orderId);
    if (!order || order.shop_id !== shop.id) {
      throw new BadRequestError("Order not found or unauthorized");
    }

    if (order.order_status !== "OUT_FOR_DELIVERY") {
      throw new BadRequestError(
        `Cannot mark failed for order with status ${order.order_status}`
      );
    }

    const failureNote = reason
      ? `[Delivery Failed: ${reason}]`
      : "[Delivery Failed]";

    await orderRepository.update(orderId, {
      order_status: "DELIVERY_FAILED",
      customer_notes: order.customer_notes
        ? `${order.customer_notes}\n${failureNote}`
        : failureNote,
    });

    if (order.user_id) {
      try {
        await notificationService.publishNotification(order.user_id, {
          title: "⚠️ Delivery Failed",
          message: `The runner was unable to deliver your order ${order.display_id}. Please contact the shop immediately.`,
          type: "ERROR",
          category: "ORDER",
          action_url: `/orders/${orderId}`,
        });
      } catch (notifyErr) {
        log.error(`Failed to send delivery failed notification: ${notifyErr}`);
      }
    }

    return createSuccessResponse(null, "Order marked as delivery failed.");
  } catch (error) {
    log.error({ err: error }, "DELIVERY FAILED ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to mark delivery failed.");
  }
}
