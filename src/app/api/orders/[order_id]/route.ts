import { NextRequest } from "next/server";

import { orderRepository } from "@/di/container";
import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("order-detail-api");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const { order_id } = await params;
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    const order = await orderRepository.getOrderById(order_id, {
      include: orderWithDetailsInclude,
    });

    if (!order) {
      return jsonResponse(createErrorResponse("Order not found"), 404);
    }

    if (order.user_id !== user_id) {
      return jsonResponse(
        createErrorResponse("Unauthorized to view this order"),
        403
      );
    }

    return jsonResponse(
      createSuccessResponse(
        serializeOrderWithDetails(order),
        "Order retrieved successfully"
      ),
      200
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return jsonResponse(
        createErrorResponse("Unauthorized to view this order"),
        403
      );
    }
    log.error({ err: error }, "GET ORDER DETAIL API ERROR:");
    return jsonResponse(createErrorResponse("Failed to retrieve order"), 500);
  }
}
