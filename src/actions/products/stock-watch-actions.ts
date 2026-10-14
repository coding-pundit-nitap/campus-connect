"use server";

import { requireUserId, runAction } from "@/actions/_shared/action-helpers";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
const log = createLogger("stock-watch-actions");

export async function toggleStockWatchAction(
  product_id: string
): Promise<ActionResponse<{ isWatching: boolean }>> {
  return runAction(
    log,
    {
      label: "TOGGLE STOCK WATCH ERROR:",
      fallback: "Failed to update stock watch.",
      passthrough: [UnauthorizedError, NotFoundError, BadRequestError],
    },
    async () => {
      const userId = await requireUserId();

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
      }

      await prisma.stockWatch.create({
        data: { user_id: userId, product_id: product_id },
      });
      return createSuccessResponse(
        { isWatching: true },
        `You'll be notified when "${product.name}" is back in stock`
      );
    }
  );
}
