import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("stock-watch-route");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get("product_id");

    const user_id = await authUtils.getUserId();
    if (!user_id) {
      if (product_id) {
        return jsonResponse(createSuccessResponse(false, "Not logged in"), 200);
      }
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    if (product_id) {
      const watch = await prisma.stockWatch.findUnique({
        where: {
          user_id_product_id: { user_id, product_id },
        },
      });
      return jsonResponse(
        createSuccessResponse(!!watch, "Stock watch status retrieved"),
        200
      );
    }

    const watches = await prisma.stockWatch.findMany({
      where: { user_id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image_key: true,
            stock_quantity: true,
            deleted_at: true,
            shop: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const validWatches = watches
      .filter((watch) => watch.product.deleted_at === null)
      .map((watch) => ({
        id: watch.id,
        product: {
          id: watch.product.id,
          name: watch.product.name,
          price: watch.product.price.toString(),
          image_key: watch.product.image_key,
          stock_quantity: watch.product.stock_quantity,
          shop: { name: watch.product.shop.name },
        },
      }));

    return jsonResponse(
      createSuccessResponse(validWatches, "Stock watches retrieved"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET STOCK WATCHES ERROR:");
    return jsonResponse(createErrorResponse("Internal Server Error"), 500);
  }
}
