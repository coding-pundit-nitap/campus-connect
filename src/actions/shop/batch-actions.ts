"use server";

import { batchService } from "@/di/container";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";
import batchRepository from "@/repositories/batch.repository";
import shopRepository from "@/repositories/shop.repository";
import { createSuccessResponse } from "@/types/response.types";

export async function updateBatchCutoffTimeAction(
  batchId: string,
  newCutoffTime: Date
) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const batch = await batchRepository.findById(batchId);
    if (!batch || batch.shop_id !== shop.id) {
      throw new BadRequestError("Batch not found or unauthorized");
    }

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

    if (diffHours > 3) {
      throw new BadRequestError(
        "Batch adjustment limit is 3 hours from the original time."
      );
    }

    await batchRepository.update(batchId, {
      cutoff_time: updatedCutoff,
    });

    return createSuccessResponse(null, "Batch time updated successfully.");
  } catch (error) {
    console.error("UPDATE BATCH TIME ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update batch time.");
  }
}

export async function closeBatchAction(batchId: string) {
  try {
    const user = await authUtils.getUserData();
    if (!user.id) throw new UnauthorizedError("Not authorized");

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) throw new BadRequestError("Shop not found");

    const batch = await batchRepository.findById(batchId);
    if (!batch || batch.shop_id !== shop.id) {
      throw new BadRequestError("Batch not found or unauthorized");
    }

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
    await batchService.ensureNextOpenBatch(shop.id);

    return createSuccessResponse(null, "Batch closed and locked for delivery.");
  } catch (error) {
    console.error("CLOSE BATCH ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to close batch.");
  }
}
