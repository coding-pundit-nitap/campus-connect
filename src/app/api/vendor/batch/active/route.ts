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

    const activeBatch = await batchRepository.findOpenBatchByShopId(shopId);
    if (!activeBatch) {
      return jsonResponse(
        createSuccessResponse(
          { batch: null, orders: [] },
          "No active batch found"
        ),
        200
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        batch_id: activeBatch.id,
        order_status: { in: ["NEW", "BATCHED"] },
      },
      include: orderWithDetailsInclude,
      orderBy: { created_at: "asc" },
    });

    return jsonResponse(
      createSuccessResponse(
        { batch: activeBatch, orders: orders.map(serializeOrderWithDetails) },
        "Active batch retrieved"
      ),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET active batch data error:");
    return internalErrorResponse();
  }
}
