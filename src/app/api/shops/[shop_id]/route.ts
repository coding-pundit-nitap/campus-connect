import { NextRequest } from "next/server";

import { shopRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { formatShopData } from "@/lib/shop-utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
const log = createLogger("route");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  try {
    const { shop_id } = await params;
    const shopData = await shopRepository.findById(shop_id, {
      include: { user: { select: { name: true, email: true } } },
    });

    if (!shopData) {
      const errorResponse = createErrorResponse("Shop not found");
      return jsonResponse(errorResponse, 404);
    }

    const shop = formatShopData(shopData);
    const successResponse = createSuccessResponse(
      shop,
      "Shop retrieved successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    log.error({ err: error }, "GET SHOP ERROR:");
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
