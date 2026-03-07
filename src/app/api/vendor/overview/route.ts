import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types";

export async function GET() {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      return jsonResponse({ error: "You do not own a shop" }, 403);
    }

    const [
      productCount,
      categoryCount,
      totalOrders,
      pendingOrders,
      todayCompletedOrders,
    ] = await Promise.all([
      prisma.product.count({
        where: { shop_id: shopId, deleted_at: null },
      }),
      prisma.category.count({
        where: { shop_id: shopId },
      }),
      prisma.order.count({
        where: { shop_id: shopId },
      }),
      prisma.order.count({
        where: {
          shop_id: shopId,
          order_status: { in: ["NEW", "BATCHED", "OUT_FOR_DELIVERY"] },
        },
      }),
      prisma.order.findMany({
        where: {
          shop_id: shopId,
          order_status: "COMPLETED",
          actual_delivery_time: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        select: {
          item_total: true,
          delivery_fee: true,
          platform_fee: true,
        },
      }),
    ]);

    const todayEarnings = todayCompletedOrders.reduce((sum, order) => {
      return (
        sum +
        Number(order.item_total) +
        Number(order.delivery_fee) -
        Number(order.platform_fee)
      );
    }, 0);

    return jsonResponse(
      createSuccessResponse({
        productCount,
        categoryCount,
        totalOrders,
        pendingOrders,
        todayEarnings: Math.round(todayEarnings * 100) / 100,
      }),
      200
    );
  } catch (error) {
    console.error("GET vendor overview error:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get vendor overview",
      },
      500
    );
  }
}
