"use server";

import {
  generateDeliveryOtp,
  notifyUserSafely,
  publishBatchRowProgress,
  requireVendorShopId,
  runAction,
} from "@/actions/_shared/action-helpers";
import { paymentStatusForTransition } from "@/actions/orders/order-status";
import { batchRepository, batchService, orderRepository } from "@/di/container";
import { Prisma } from "@/generated/client";
import { BadRequestError, UnauthorizedError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getOrderUrl } from "@/lib/utils/url.utils";
import { createSuccessResponse } from "@/types/response.types";
const log = createLogger("order-management-actions");

const VENDOR_ERRORS = [UnauthorizedError, BadRequestError];

/** Appends `note` on its own line to the existing customer notes. */
function appendNote(notes: string | null, note: string): string {
  return notes ? `${notes}\n${note}` : note;
}

/** Order `orderId` when it belongs to `shopId`, else BadRequestError. */
async function requireShopOrder(orderId: string, shopId: string) {
  const order = await orderRepository.getOrderById(orderId);
  if (!order || order.shop_id !== shopId) {
    throw new BadRequestError("Order not found or unauthorized");
  }
  return order;
}

export async function acceptOrderAction(orderId: string) {
  return runAction(
    log,
    {
      label: "ACCEPT ORDER ERROR:",
      fallback: "Failed to accept order.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const order = await requireShopOrder(orderId, shopId);

      if (order.order_status !== "NEW") {
        throw new BadRequestError(
          `Cannot accept order with status ${order.order_status}`
        );
      }

      // Pre-fetch the next slot in case we need to roll over
      const nextSlot = await batchService.getNextSlot(shopId);

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

          if (lockedBatch?.[0] && lockedBatch[0].status !== "OPEN") {
            isRescheduled = true;
            if (nextSlot.batch_id) {
              newBatchId = nextSlot.batch_id;
            } else {
              isConvertedToDirect = true;
              newBatchId = null;
            }
          }
        }

        const updateData: Prisma.OrderUpdateInput = {
          order_status: isRescheduled ? "RESCHEDULED" : "BATCHED",
        };

        if (isConvertedToDirect) {
          updateData.batch = { disconnect: true };
          updateData.is_direct_delivery = true;
          updateData.customer_notes = appendNote(
            order.customer_notes,
            "[Auto-converted to Direct Delivery due to missed batch]"
          );
        } else if (isRescheduled && newBatchId) {
          updateData.batch = { connect: { id: newBatchId } };
          updateData.customer_notes = appendNote(
            order.customer_notes,
            "[Moved to next batch due to missed cutoff]"
          );
        }

        await tx.order.update({
          where: { id: orderId },
          data: updateData,
        });

        return { isRescheduled, isConvertedToDirect, newBatchId };
      });

      const notification = result.isRescheduled
        ? {
            title: "🕒 Order Rescheduled",
            message: result.isConvertedToDirect
              ? `Your order ${order.display_id} missed the batch cutoff and has been upgraded to Direct Delivery for free!`
              : `Your order ${order.display_id} missed the batch cutoff and has been moved to the next available batch.`,
            type: "WARNING" as const,
          }
        : {
            title: "✅ Order Accepted",
            message: `Your order ${order.display_id} has been accepted by the shop and is being prepared.`,
            type: "SUCCESS" as const,
          };

      await notifyUserSafely(
        log,
        order.user_id,
        {
          ...notification,
          category: "ORDER",
          action_url: getOrderUrl(orderId),
        },
        "Failed to send order accepted notification:"
      );

      return createSuccessResponse(
        null,
        result.isRescheduled
          ? "Order accepted and rescheduled (missed cutoff)."
          : "Order accepted successfully."
      );
    }
  );
}

export async function startDirectDeliveryAction(orderId: string) {
  return runAction(
    log,
    {
      label: "START DIRECT DELIVERY ERROR:",
      fallback: "Failed to start direct delivery.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const order = await requireShopOrder(orderId, shopId);
      if (!order.is_direct_delivery) {
        throw new BadRequestError("Order not found or unauthorized");
      }

      if (order.order_status !== "BATCHED") {
        throw new BadRequestError(
          `Cannot start delivery for order with status ${order.order_status}`
        );
      }

      const otp = order.delivery_otp || generateDeliveryOtp();

      await orderRepository.update(orderId, {
        order_status: "OUT_FOR_DELIVERY",
        delivery_otp: otp,
      });

      await notifyUserSafely(
        log,
        order.user_id,
        {
          title: "🚀 Order Out for Delivery!",
          message: `Your order ${order.display_id} is out for delivery. Share OTP ${otp} to complete delivery.`,
          type: "SUCCESS",
          category: "ORDER",
          action_url: getOrderUrl(orderId),
        },
        "Failed to send direct delivery notification:"
      );

      return createSuccessResponse(null, "Direct delivery started.");
    }
  );
}

export async function rejectOrderAction(orderId: string, reason?: string) {
  return runAction(
    log,
    {
      label: "REJECT ORDER ERROR:",
      fallback: "Failed to reject order.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const order = await requireShopOrder(orderId, shopId);

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

      const paymentStatus = paymentStatusForTransition(
        "CANCELLED",
        order.payment_method,
        order.payment_status
      );

      const updatedBatch = await prisma.$transaction(async (tx) => {
        await orderRepository.update(
          orderId,
          {
            order_status: "CANCELLED",
            payment_status: paymentStatus,
            cancellation_reason: reason || null,
            customer_notes: appendNote(order.customer_notes, rejectionNote),
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
        order.user_id,
        {
          title: "❌ Order Rejected by Vendor",
          message: `Your order ${order.display_id} was rejected by the shop. A refund has been initiated if you paid online.`,
          type: "ERROR",
          category: "ORDER",
          action_url: getOrderUrl(orderId),
        },
        "Failed to send order rejection notification:"
      );

      return createSuccessResponse(null, "Order rejected successfully.");
    }
  );
}

export async function verifyDeliveryOtpAction(orderId: string, otp: string) {
  return runAction(
    log,
    {
      label: "VERIFY OTP ERROR:",
      fallback: "Failed to verify OTP.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const order = await requireShopOrder(orderId, shopId);

      if (order.order_status !== "OUT_FOR_DELIVERY") {
        throw new BadRequestError(
          "Order is not in a valid state for delivery."
        );
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

      await notifyUserSafely(
        log,
        order.user_id,
        {
          title: "🎉 Order Delivered!",
          message: `Your order ${order.display_id} was successfully delivered. Thank you!`,
          type: "SUCCESS",
          category: "ORDER",
          action_url: getOrderUrl(orderId),
        },
        "Failed to send order delivery notification:"
      );

      return createSuccessResponse(null, "OTP verified and order completed.");
    }
  );
}

export async function markDeliveryFailedAction(
  orderId: string,
  reason: string
) {
  return runAction(
    log,
    {
      label: "DELIVERY FAILED ERROR:",
      fallback: "Failed to mark delivery failed.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const order = await requireShopOrder(orderId, shopId);

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
        customer_notes: appendNote(order.customer_notes, failureNote),
      });

      await notifyUserSafely(
        log,
        order.user_id,
        {
          title: "⚠️ Delivery Failed",
          message: `The runner was unable to deliver your order ${order.display_id}. Please contact the shop immediately.`,
          type: "ERROR",
          category: "ORDER",
          action_url: getOrderUrl(orderId),
        },
        "Failed to send delivery failed notification:"
      );

      return createSuccessResponse(null, "Order marked as delivery failed.");
    }
  );
}
