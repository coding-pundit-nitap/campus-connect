import { internalErrorResponse } from "@/app/api/_lib/route-helpers";
import { resolveVendorShop } from "@/app/api/_lib/vendor-shop";
import { batchRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import { createSuccessResponse } from "@/types/response.types";
const log = createLogger("route");

export async function GET() {
  try {
    const { shopId, error } = await resolveVendorShop();
    if (error) return error;

    // NOTE: uses `include` (not `select`) so new Batch scalar columns
    // (e.g. collective_total, min_order_value_snapshot) pass through
    // automatically — switching to `select` requires listing them explicitly.
    const [openBatch, activeBatches] = await Promise.all([
      batchRepository.findOpenBatchByShopId(shopId, {
        include: { delivery_status: true },
      }),
      batchRepository.findActiveBatches(shopId, {
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
          shop_id: shopId,
          is_direct_delivery: true,
          order_status: { in: ["NEW", "BATCHED", "OUT_FOR_DELIVERY"] },
        },
        include: orderWithDetailsInclude,
        orderBy: { created_at: "asc" },
      }),
      prisma.order.findMany({
        where: {
          shop_id: shopId,
          OR: [
            {
              batch: {
                status: { in: ["LOCKED", "IN_TRANSIT"] },
              },
              order_status: {
                in: ["BATCHED", "OUT_FOR_DELIVERY", "DELIVERY_FAILED"],
              },
            },
            {
              is_direct_delivery: true,
              order_status: { in: ["OUT_FOR_DELIVERY", "DELIVERY_FAILED"] },
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
    return internalErrorResponse();
  }
}
