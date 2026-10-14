"use server";

import { requireOwnedShopId } from "@/actions/_shared/action-helpers";
import { batchService } from "@/di/container";
import { BatchMilestone } from "@/generated/client";
import { ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse } from "@/types";

/** Throws ValidationError unless batch `batchId` belongs to `shopId`. */
async function assertShopBatch(batchId: string, shopId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { shop_id: true },
  });
  if (!batch || batch.shop_id !== shopId) {
    throw new ValidationError("Batch not found or unauthorized");
  }
}

export async function lockBatchAction(batchId: string) {
  const shopId = await requireOwnedShopId();

  await batchService.lockBatch(batchId, shopId);
  return createSuccessResponse(
    null,
    "Batch locked. Orders are now in PREP MODE."
  );
}

export async function startBatchDeliveryAction(batchId: string) {
  const shopId = await requireOwnedShopId();

  await assertShopBatch(batchId, shopId);

  await batchService.startDelivery(batchId);
  return createSuccessResponse(
    null,
    "Delivery started. Orders marked as OUT_FOR_DELIVERY."
  );
}

export async function unlockBatchAction(batchId: string) {
  const shopId = await requireOwnedShopId();

  await assertShopBatch(batchId, shopId);

  await batchService.unlockBatch(batchId);
  return createSuccessResponse(
    null,
    "Batch unlocked. Orders moved back to PREP MODE."
  );
}

export async function completeBatchAction(batchId: string) {
  const shopId = await requireOwnedShopId();

  await assertShopBatch(batchId, shopId);

  await batchService.completeBatch(batchId);
  return createSuccessResponse(null, "Batch completed.");
}

export async function cancelBatchAction(batchId: string, reason?: string) {
  const shopId = await requireOwnedShopId();

  await assertShopBatch(batchId, shopId);

  const result = await batchService.cancelBatch(
    batchId,
    reason || "Vendor cancelled"
  );
  return createSuccessResponse(
    null,
    `Batch cancelled. ${result.cancelled_orders} orders affected.`
  );
}

export async function verifyOrderOtpAction(orderId: string, otp: string) {
  const shopId = await requireOwnedShopId();

  if (!otp || typeof otp !== "string" || otp.length !== 4) {
    throw new ValidationError("Invalid OTP format. Must be 4 digits.");
  }

  const result = await batchService.verifyOrderOtp(orderId, otp, shopId);
  if (!result.success) {
    throw new ValidationError(result.message);
  }

  return createSuccessResponse(null, result.message);
}

export async function updateBatchMilestoneAction({
  batchId,
  milestone,
  riderName,
  riderPhone,
  estimatedArrival,
}: {
  batchId: string;
  milestone: BatchMilestone;
  riderName?: string;
  riderPhone?: string;
  estimatedArrival?: Date;
}) {
  const shopId = await requireOwnedShopId();

  await assertShopBatch(batchId, shopId);

  await batchService.updateBatchMilestone(
    batchId,
    milestone,
    riderName,
    riderPhone,
    estimatedArrival
  );
  return createSuccessResponse(null, "Batch milestone updated successfully.");
}
