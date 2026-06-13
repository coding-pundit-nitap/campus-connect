import { orderRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
const log = createLogger("route");

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return jsonResponse(createErrorResponse("User not authenticated"), 401);
    }

    const orders = await orderRepository.getOrdersByUserId(user_id, {
      include: { items: true, shop: true },
    });

    return jsonResponse(createSuccessResponse(orders), 200);
  } catch (error) {
    log.error({ err: error }, "GET USER ORDERS ERROR:");
    return jsonResponse(
      createErrorResponse("An internal server error occurred."),
      500
    );
  }
}
