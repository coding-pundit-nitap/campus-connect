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
    return internalErrorResponse();
  }
}
