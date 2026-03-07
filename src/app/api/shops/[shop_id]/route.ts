import { NextRequest } from "next/server";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { formatShopData } from "@/lib/shop-utils";
import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

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
    console.error("GET SHOP ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
