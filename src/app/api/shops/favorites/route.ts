import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("favorite-shops-route");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get("shop_id");

    const user_id = await authUtils.getUserId();
    if (!user_id) {
      if (shop_id) {
        return jsonResponse(createSuccessResponse(false, "Not logged in"), 200);
      }
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    if (shop_id) {
      const favorite = await prisma.favoriteShop.findUnique({
        where: { user_id_shop_id: { user_id, shop_id } },
      });
      return jsonResponse(
        createSuccessResponse(!!favorite, "Favorite status retrieved"),
        200
      );
    }

    const favorites = await prisma.favoriteShop.findMany({
      where: { user_id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            image_key: true,
            location: true,
            is_active: true,
            opening: true,
            closing: true,
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
          opening: f.shop.opening,
          closing: f.shop.closing,
        },
      }));

    return jsonResponse(
      createSuccessResponse(validFavorites, "Favorite shops retrieved"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET FAVORITE SHOPS ERROR:");
    return jsonResponse(createErrorResponse("Internal Server Error"), 500);
  }
}
