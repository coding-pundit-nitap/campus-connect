import { NextRequest } from "next/server";

import { dbSearchService } from "@/di/container";
import { ShopType } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("route:search:products");

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") ?? undefined;
    const shopType = searchParams.get("type") as ShopType | null;
    const isVeg = searchParams.get("veg") === "true";
    const brand_id = searchParams.get("brand_id") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "24", 10);

    const results = await dbSearchService.searchProducts({
      query: query?.trim(),
      shop_type: shopType ?? undefined,
      is_veg: shopType === "CANTEEN" && isVeg ? true : undefined,
      brand_id: shopType === "STATIONERY" && brand_id ? brand_id : undefined,
      limit,
    });

    const successResponse = createSuccessResponse(
      results,
      "Product search completed"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    log.error({ err: error }, "SEARCH PRODUCTS ERROR:");
    const errorResponse = createErrorResponse(
      "An internal server error occurred during product search."
    );
    return jsonResponse(errorResponse, 500);
  }
}
