"use server";

import {
  requireVendorShopId,
  runAction,
} from "@/actions/_shared/action-helpers";
import { batchRepository, batchService } from "@/di/container";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse } from "@/types/response.types";
const log = createLogger("batch-actions");

const VENDOR_ERRORS = [UnauthorizedError, BadRequestError];
const MAX_CUTOFF_ADJUSTMENT_HOURS = 3;
const CANCELLABLE_STATUSES = ["LOCKED", "IN_TRANSIT", "PENDING_REVIEW"];

/** Batch `batchId` when it belongs to `shopId`, else BadRequestError. */
async function requireShopBatch(batchId: string, shopId: string) {
  const batch = await batchRepository.findById(batchId);
  if (!batch || batch.shop_id !== shopId) {
    throw new BadRequestError("Batch not found or unauthorized");
  }
  return batch;
}

export async function updateBatchCutoffTimeAction(
  batchId: string,
  newCutoffTime: Date
) {
  return runAction(
    log,
    {
      label: "UPDATE BATCH TIME ERROR:",
      fallback: "Failed to update batch time.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const batch = await requireShopBatch(batchId, shopId);

      if (batch.status !== "OPEN") {
        throw new BadRequestError(
          "Cannot adjust time for a closed or locked batch"
        );
      }

      const currentCutoff = new Date(batch.cutoff_time);
      const updatedCutoff = new Date(newCutoffTime);

      const diffHours =
        Math.abs(updatedCutoff.getTime() - currentCutoff.getTime()) /
        (1000 * 60 * 60);

      if (diffHours > MAX_CUTOFF_ADJUSTMENT_HOURS) {
        throw new BadRequestError(
          "Batch adjustment limit is 3 hours from the original time."
        );
      }

      await batchRepository.update(batchId, {
        cutoff_time: updatedCutoff,
      });

      return createSuccessResponse(null, "Batch time updated successfully.");
    }
  );
}

export async function closeBatchAction(batchId: string) {
  return runAction(
    log,
    {
      label: "CLOSE BATCH ERROR:",
      fallback: "Failed to close batch.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const batch = await requireShopBatch(batchId, shopId);

      if (batch.status !== "OPEN") {
        throw new BadRequestError("Batch is already closed or locked");
      }

      const pendingNewOrders = await prisma.order.count({
        where: {
          batch_id: batchId,
          order_status: "NEW",
        },
      });

      if (pendingNewOrders > 0) {
        throw new BadRequestError(
          `Accept or reject ${pendingNewOrders} new orders before closing this batch.`
        );
      }

      await batchRepository.updateStatus(batchId, "LOCKED");
      await batchService.generateOtpForBatch(batchId);
      await batchService.ensureNextOpenBatch(shopId);

      return createSuccessResponse(
        null,
        "Batch closed and locked for delivery."
      );
    }
  );
}

export async function forceLockBatchAction(batchId: string) {
  return runAction(
    log,
    {
      label: "FORCE LOCK BATCH ERROR:",
      fallback: "Failed to force-lock batch.",
      passthrough: [...VENDOR_ERRORS, NotFoundError],
    },
    async () => {
      const shopId = await requireVendorShopId();

      await batchService.forceLockBatch(batchId, shopId);

      return createSuccessResponse(
        null,
        "Batch force-locked and prepared for delivery."
      );
    }
  );
}

export async function cancelBatchAction(
  batchId: string,
  reason: string = "Cancelled by vendor"
) {
  return runAction(
    log,
    {
      label: "CANCEL BATCH ERROR:",
      fallback: "Failed to cancel batch.",
      passthrough: VENDOR_ERRORS,
    },
    async () => {
      const shopId = await requireVendorShopId();
      const batch = await requireShopBatch(batchId, shopId);

      if (!CANCELLABLE_STATUSES.includes(batch.status)) {
        throw new BadRequestError(
          "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches"
        );
      }

      const result = await batchService.cancelBatch(batchId, reason);

      return createSuccessResponse(
        null,
        `Batch cancelled successfully. ${result.cancelled_orders} orders refunded.`
      );
    }
  );
}
