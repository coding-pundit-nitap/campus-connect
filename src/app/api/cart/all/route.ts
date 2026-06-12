import { cartService } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import { serializeFullCarts } from "@/lib/utils/product.utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
const log = createLogger("route");

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    const carts = await cartService.getAllUserCarts(user_id);
    const successResponse = createSuccessResponse(
      serializeFullCarts(carts),
      "Carts retrieved successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    log.error({ err: error }, "GET ALL CARTS ERROR:");
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
