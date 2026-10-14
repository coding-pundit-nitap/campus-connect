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
const log = createLogger("favorite-shops-actions");

export async function toggleFavoriteShopAction(
  shop_id: string
): Promise<ActionResponse<{ isFavorite: boolean }>> {
  return runAction(
    log,
    {
      label: "TOGGLE FAVORITE SHOP ERROR:",
      fallback: "Failed to update favorite status.",
      passthrough: [UnauthorizedError, NotFoundError, BadRequestError],
    },
    async () => {
      const user_id = await requireUserId();

      if (!shop_id || typeof shop_id !== "string") {
        throw new BadRequestError("Invalid shop ID");
      }

      const shop = await prisma.shop.findUnique({
        where: { id: shop_id, deleted_at: null },
      });

      if (!shop) {
        throw new NotFoundError("Shop not found");
      }

      const existing = await prisma.favoriteShop.findUnique({
        where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      });

      if (existing) {
        await prisma.favoriteShop.delete({
          where: { id: existing.id },
        });
        return createSuccessResponse(
          { isFavorite: false },
          "Shop removed from favorites"
        );
      }

      await prisma.favoriteShop.create({
        data: { user_id: user_id, shop_id: shop_id },
      });
      return createSuccessResponse(
        { isFavorite: true },
        "Shop added to favorites"
      );
    }
  );
}
