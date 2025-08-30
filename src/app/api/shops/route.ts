import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { shopServices } from "@/services";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }
    const shop = await shopServices.getShopByOwnerId();
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
