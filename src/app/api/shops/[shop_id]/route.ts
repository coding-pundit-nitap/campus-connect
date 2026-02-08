import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const shop = formatShopData(shopData);
    const successResponse = createSuccessResponse(
      shop,
      "Shop retrieved successfully"
    );
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("GET SHOP ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
