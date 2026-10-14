import { resolveVendorShop } from "@/app/api/_lib/vendor-shop";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
const log = createLogger("route");

export async function GET() {
  try {
    const { shopId, error } = await resolveVendorShop();
    if (error) return error;

    const deliveryBuildings = await prisma.shopDeliveryBuilding.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
        building: { is_active: true },
      },
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }],
    });

    return jsonResponse(
      createSuccessResponse(
        deliveryBuildings,
        "Shop delivery buildings fetched successfully"
      ),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET vendor delivery buildings error:");
    return jsonResponse(
      createErrorResponse("Failed to fetch delivery buildings"),
      500
    );
  }
}
