import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import batchRepository from "@/repositories/batch.repository";
import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

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

    const activeBatch = await batchRepository.findOpenBatchByShopId(shop.id);
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
    console.error("GET active batch data error:", error);
    return jsonResponse(
      createErrorResponse(
        error instanceof Error
          ? error.message
          : "Failed to get active batch data"
      ),
      500
    );
  }
}
