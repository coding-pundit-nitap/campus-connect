"use server";

import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types";

type BatchSlotDTO = {
  id: string;
  cutoff_time_minutes: number;
  label: string | null;
  is_active: boolean;
  sort_order: number;
};

function ensureMinutesFromMidnight(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 1439) {
    throw new ValidationError("Invalid cutoff time. Must be 0-1439 minutes.");
  }
}

function mapPrismaErrorToMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("batch_slot") ||
    message.includes("BatchSlot") ||
    message.toLowerCase().includes("does not exist")
  ) {
    return "Batch Cards are not available yet (database migration pending).";
  }
  return "Failed to manage batch cards.";
}

export async function listBatchSlotsAction() {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  try {
    const slots: BatchSlotDTO[] = await prisma.batchSlot.findMany({
      where: { shop_id: shopId },
      select: {
        id: true,
        cutoff_time_minutes: true,
        label: true,
        is_active: true,
        sort_order: true,
      },
      orderBy: [{ sort_order: "asc" }, { cutoff_time_minutes: "asc" }],
    });

    return createSuccessResponse(slots);
  } catch (error) {
    throw new ValidationError(mapPrismaErrorToMessage(error));
  }
}

export async function createBatchSlotAction(input: {
  cutoff_time_minutes: number;
  label?: string | null;
}) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  ensureMinutesFromMidnight(input.cutoff_time_minutes);

  try {
    const maxSort = await prisma.batchSlot.aggregate({
      where: { shop_id: shopId },
      _max: { sort_order: true },
    });

    const created = await prisma.batchSlot.create({
      data: {
        shop_id: shopId,
        cutoff_time_minutes: input.cutoff_time_minutes,
        label: input.label?.trim() || null,
        is_active: true,
        sort_order: (maxSort._max.sort_order ?? -1) + 1,
      },
      select: {
        id: true,
        cutoff_time_minutes: true,
        label: true,
        is_active: true,
        sort_order: true,
      },
    });

    return createSuccessResponse(created, "Batch card created");
  } catch (error) {
    throw new ValidationError(mapPrismaErrorToMessage(error));
  }
}

export async function updateBatchSlotAction(input: {
  id: string;
  cutoff_time_minutes: number;
  label?: string | null;
  is_active?: boolean;
}) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }
  ensureMinutesFromMidnight(input.cutoff_time_minutes);

  try {
    const existing = await prisma.batchSlot.findUnique({
      where: { id: input.id },
      select: { id: true, shop_id: true },
    });
    if (!existing || existing.shop_id !== shopId) {
      throw new ValidationError("Batch card not found or unauthorized");
    }

    const updated = await prisma.batchSlot.update({
      where: { id: input.id },
      data: {
        cutoff_time_minutes: input.cutoff_time_minutes,
        label: input.label?.trim() || null,
        ...(typeof input.is_active === "boolean"
          ? { is_active: input.is_active }
          : {}),
      },
      select: {
        id: true,
        cutoff_time_minutes: true,
        label: true,
        is_active: true,
        sort_order: true,
      },
    });

    return createSuccessResponse(updated, "Batch card updated");
  } catch (error) {
    throw new ValidationError(mapPrismaErrorToMessage(error));
  }
}

export async function deleteBatchSlotAction(id: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  try {
    const existing = await prisma.batchSlot.findUnique({
      where: { id },
      select: { id: true, shop_id: true },
    });
    if (!existing || existing.shop_id !== shopId) {
      throw new ValidationError("Batch card not found or unauthorized");
    }

    await prisma.batchSlot.delete({ where: { id } });
    return createSuccessResponse(null, "Batch card deleted");
  } catch (error) {
    throw new ValidationError(mapPrismaErrorToMessage(error));
  }
}

export async function reorderBatchSlotsAction(input: {
  ordered_ids: string[];
}) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  if (!Array.isArray(input.ordered_ids) || input.ordered_ids.length === 0) {
    throw new ValidationError("Invalid ordering payload.");
  }

  try {
    const existing = await prisma.batchSlot.findMany({
      where: { shop_id: shopId },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((s) => s.id));
    for (const id of input.ordered_ids) {
      if (!existingIds.has(id)) {
        throw new ValidationError("One or more batch cards are invalid.");
      }
    }

    await prisma.$transaction(
      input.ordered_ids.map((id, idx) =>
        prisma.batchSlot.update({
          where: { id },
          data: { sort_order: idx },
        })
      )
    );

    return createSuccessResponse(null, "Batch cards reordered");
  } catch (error) {
    throw new ValidationError(mapPrismaErrorToMessage(error));
  }
}
