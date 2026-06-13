import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("announcements-api");

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const announcements = await prisma.shopAnnouncement.findMany({
      where: {
        expires_at: { gt: new Date() },
      },
      include: {
        shop: {
          select: { name: true, shop_type: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discount: true,
            stock_quantity: true,
            image_key: true,
            brand: true,
            is_veg: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const serialized = announcements.map((ann) => ({
      id: ann.id,
      shop_id: ann.shop_id,
      shop_name: ann.shop.name,
      shop_type: ann.shop.shop_type,
      title: ann.title,
      message: ann.message,
      image_key: ann.image_key,
      expires_at: ann.expires_at.toISOString(),
      created_at: ann.created_at.toISOString(),
      product: ann.product
        ? {
            id: ann.product.id,
            name: ann.product.name,
            price: Number(ann.product.price),
            discount: ann.product.discount
              ? Number(ann.product.discount)
              : null,
            stock_quantity: ann.product.stock_quantity,
            image_key: ann.product.image_key,
            brand: ann.product.brand,
            is_veg: ann.product.is_veg,
          }
        : null,
    }));

    return jsonResponse(
      createSuccessResponse(serialized, "Announcements retrieved successfully"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET ANNOUNCEMENTS API ERROR:");
    return jsonResponse(
      createErrorResponse("Failed to fetch announcements"),
      500
    );
  }
}
