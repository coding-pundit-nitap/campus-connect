import { internalErrorResponse } from "@/app/api/_lib/route-helpers";
import { resolveVendorShop } from "@/app/api/_lib/vendor-shop";
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

    const orders = await prisma.order.findMany({
      where: {
        shop_id: shopId,
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
    });

    return jsonResponse(
      createSuccessResponse(
        orders.map(serializeOrderWithDetails),
        "Delivery run data retrieved"
      ),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET delivery run data error:");
    return internalErrorResponse();
  }
}
