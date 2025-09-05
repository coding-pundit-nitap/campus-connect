import { NextResponse } from "next/server";

import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const config = {
  runtime: "edge",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  try {
    const { shop_id } = await params;
    const shop = await shopRepository.findById(shop_id);

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
