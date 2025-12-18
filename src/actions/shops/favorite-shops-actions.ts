"use server";

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

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
    console.error("TOGGLE FAVORITE SHOP ERROR:", error);
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

export async function getFavoriteShopsAction(): Promise<
  ActionResponse<
    Array<{
      id: string;
      shop: {
        id: string;
        name: string;
        image_key: string;
        location: string;
        is_active: boolean;
      };
    }>
  >
> {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const favorites = await prisma.favoriteShop.findMany({
      where: { user_id: user_id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            image_key: true,
            location: true,
            is_active: true,
            deleted_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const validFavorites = favorites
      .filter((f) => f.shop.deleted_at === null)
      .map((f) => ({
        id: f.id,
        shop: {
          id: f.shop.id,
          name: f.shop.name,
          image_key: f.shop.image_key,
          location: f.shop.location,
          is_active: f.shop.is_active,
        },
      }));

    return createSuccessResponse(validFavorites, "Favorite shops retrieved");
  } catch (error) {
    console.error("GET FAVORITE SHOPS ERROR:", error);
    throw new InternalServerError("Failed to retrieve favorite shops.");
  }
}

export async function isFavoriteShopAction(
  shop_id: string
): Promise<ActionResponse<boolean>> {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return createSuccessResponse(false, "Not logged in");
    }

    const favorite = await prisma.favoriteShop.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
    });

    return createSuccessResponse(!!favorite, "Favorite status retrieved");
  } catch (error) {
    console.error("IS FAVORITE SHOP ERROR:", error);
    return createSuccessResponse(false, "Error checking favorite status");
  }
}
