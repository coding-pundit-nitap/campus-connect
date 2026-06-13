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
const log = createLogger("favorite-shops-actions");

export async function toggleFavoriteShopAction(
  shop_id: string
): Promise<ActionResponse<{ isFavorite: boolean }>> {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

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
    } else {
      await prisma.favoriteShop.create({
        data: { user_id: user_id, shop_id: shop_id },
      });
      return createSuccessResponse(
        { isFavorite: true },
        "Shop added to favorites"
      );
    }
  } catch (error) {
    log.error({ err: error }, "TOGGLE FAVORITE SHOP ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update favorite status.");
  }
}
