import { shopRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
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

    const deliveryBuildings = await prisma.shopDeliveryBuilding.findMany({
      where: {
        shop_id: shop.id,
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
