import { NextRequest, NextResponse } from "next/server";

import authUtils from "@/lib/utils/auth.utils";
import { shopRepository } from "@/repositories";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

export async function GET(_request: NextRequest) {
  try {
    await authUtils.isAuthenticated();
    const shop = await shopRepository.getShopOwned();
    if (!shop) {
      const errorResponse = createErrorResponse("Shop not found");
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const successResponse = createSuccessResponse(
      shop,
      "Shop fetched successfully"
    );
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("GET SHOPS ERROR:", error);
    const errorResponse = createErrorResponse("Internal Server Error");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
