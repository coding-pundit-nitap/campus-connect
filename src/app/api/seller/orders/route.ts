import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import orderRepository from "@/repositories/order.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET() {
  try {
    const shop_id = await authUtils.getOwnedShopId();
    const orders = await orderRepository.getOrdersByShopId(shop_id);
    const successResponse = createSuccessResponse(
      orders,
      "Seller orders retrieved successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    console.error("GET SELLER ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return jsonResponse(errorResponse, 500);
  }
}
