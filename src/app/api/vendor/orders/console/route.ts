import { batchRepository, shopRepository } from "@/di/container";
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
    if (!user.id) {
      return jsonResponse(createErrorResponse("Not authorized"), 401);
    }

    const shop = await shopRepository.findByOwnerId(user.id, {
      select: { id: true },
    });
    if (!shop) {
      return jsonResponse(createErrorResponse("Shop not found"), 400);
    }

    const [openBatch, activeBatches] = await Promise.all([
      batchRepository.findOpenBatchByShopId(shop.id, {
        include: { delivery_status: true },
      }),
      batchRepository.findActiveBatches(shop.id, {
        include: { delivery_status: true },
      }),
    ]);
    const activeBatch = openBatch ?? activeBatches[0] ?? null;

    const [batchOrders, directOrders, deliveryOrders] = await Promise.all([
      activeBatch?.status === "OPEN"
        ? prisma.order.findMany({
            where: {
              batch_id: activeBatch.id,
              order_status: { in: ["NEW", "BATCHED"] },
            },
            include: orderWithDetailsInclude,
            orderBy: { created_at: "asc" },
          })
        : Promise.resolve([]),
      prisma.order.findMany({
        where: {
          shop_id: shop.id,
          is_direct_delivery: true,
          order_status: { in: ["NEW", "BATCHED", "OUT_FOR_DELIVERY"] },
        },
        include: orderWithDetailsInclude,
        orderBy: { created_at: "asc" },
      }),
      prisma.order.findMany({
        where: {
          shop_id: shop.id,
          OR: [
            {
              batch: {
                status: { in: ["LOCKED", "IN_TRANSIT"] },
              },
              order_status: { in: ["BATCHED", "OUT_FOR_DELIVERY"] },
            },
            {
              is_direct_delivery: true,
              order_status: "OUT_FOR_DELIVERY",
            },
          ],
        },
        include: orderWithDetailsInclude,
        orderBy: { created_at: "asc" },
      }),
    ]);

    return jsonResponse(
      createSuccessResponse(
        {
          activeBatch,
          batchOrders: batchOrders.map(serializeOrderWithDetails),
          directOrders: directOrders.map(serializeOrderWithDetails),
          deliveryOrders: deliveryOrders.map(serializeOrderWithDetails),
        },
        "Vendor order console retrieved"
      ),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET vendor order console error:");
    return jsonResponse(
      createErrorResponse(
        error instanceof Error
          ? error.message
          : "Failed to get vendor order console"
      ),
      500
    );
  }
}
