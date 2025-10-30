import { NextResponse } from "next/server";

import authUtils from "@/lib/utils/auth.utils.server";
import { serializeFullCarts } from "@/lib/utils/product.utils";
import { cartService } from "@/services/cart";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return NextResponse.json(createErrorResponse("User not authenticated"), {
        status: 401,
      });
    }

    const carts = await cartService.getAllUserCarts(user_id);
    const successResponse = createSuccessResponse(
      serializeFullCarts(carts),
      "All carts retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET ALL CARTS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
