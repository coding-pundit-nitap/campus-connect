import { shopRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
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
const log = createLogger("route");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await authUtils.getUserData();
    if (!user.id)
      return jsonResponse(createErrorResponse("Not authorized"), 401);

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) return jsonResponse(createErrorResponse("Shop not found"), 400);

    const orders = await prisma.order.findMany({
      where: {
        shop_id: shop.id,
        is_direct_delivery: true,
        order_status: { in: ["NEW", "BATCHED", "OUT_FOR_DELIVERY"] },
      },
      include: orderWithDetailsInclude,
      orderBy: { created_at: "asc" },
    });

    return jsonResponse(
      createSuccessResponse(
        orders.map(serializeOrderWithDetails),
        "Direct deliveries retrieved"
      ),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET direct deliveries error:");
    return jsonResponse(
      createErrorResponse(
        error instanceof Error
          ? error.message
          : "Failed to get direct deliveries data"
      ),
      500
    );
  }
}
