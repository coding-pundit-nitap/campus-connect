import { NextResponse } from "next/server";
import shopServices from "@/services/shop.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { shopId } = params;
    const shop = await shopServices.getShopById(shopId);

    if (!shop) {
      const errorResponse = createErrorResponse("Shop not found");
      return NextResponse.json(errorResponse, { status: 404 });
    }

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
