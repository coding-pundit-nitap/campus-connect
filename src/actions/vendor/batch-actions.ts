"use server";

import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function lockBatchAction(batchId: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  await batchService.lockBatch(batchId, shopId);
  return createSuccessResponse(
    null,
    "Batch locked. Orders are now in PREP MODE."
  );
}

export async function startBatchDeliveryAction(batchId: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { shop_id: true },
  });
  if (!batch || batch.shop_id !== shopId) {
    throw new ValidationError("Batch not found or unauthorized");
  }

  await batchService.startDelivery(batchId);
  return createSuccessResponse(
    null,
    "Delivery started. Orders marked as OUT_FOR_DELIVERY."
  );
}

export async function completeBatchAction(batchId: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { shop_id: true },
  });
  if (!batch || batch.shop_id !== shopId) {
    throw new ValidationError("Batch not found or unauthorized");
  }

  await batchService.completeBatch(batchId);
  return createSuccessResponse(null, "Batch completed.");
}

export async function cancelBatchAction(batchId: string, reason?: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { shop_id: true },
  });
  if (!batch || batch.shop_id !== shopId) {
    throw new ValidationError("Batch not found or unauthorized");
  }

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
