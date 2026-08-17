"use server";

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
const log = createLogger("stock-watch-actions");

export async function toggleStockWatchAction(
  product_id: string
): Promise<ActionResponse<{ isWatching: boolean }>> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    if (!product_id || typeof product_id !== "string") {
      throw new BadRequestError("Invalid product ID");
    }

    const product = await prisma.product.findUnique({
      where: { id: product_id, deleted_at: null },
      select: { id: true, name: true, stock_quantity: true },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const existing = await prisma.stockWatch.findUnique({
      where: {
        user_id_product_id: { user_id: userId, product_id: product_id },
      },
    });

    if (existing) {
      await prisma.stockWatch.delete({
        where: { id: existing.id },
      });
      return createSuccessResponse(
        { isWatching: false },
        "Stock notification removed"
      );
    } else {
      await prisma.stockWatch.create({
        data: { user_id: userId, product_id: product_id },
      });
      return createSuccessResponse(
        { isWatching: true },
        `You'll be notified when "${product.name}" is back in stock`
      );
    }
  } catch (error) {
    log.error({ err: error }, "TOGGLE STOCK WATCH ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update stock watch.");
  }
}
