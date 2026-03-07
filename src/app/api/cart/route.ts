import { jsonResponse } from "@/lib/serializers/response-serializer";
import { serializeFullCart } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils.server";
import cartRepository from "@/repositories/cart.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET(request: Request) {
  try {
    const user_id = await authUtils.getUserId();
    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get("shop_id");

    if (!shop_id) {
      const errorResponse = createErrorResponse(
        "shop_id query parameter is required"
      );
      return jsonResponse(errorResponse, 400);
    }

    const cart = await cartRepository.findOrCreate(user_id, shop_id);
    const successResponse = createSuccessResponse(
      serializeFullCart(cart),
      "Cart retrieved successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    console.error("GET CART ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
