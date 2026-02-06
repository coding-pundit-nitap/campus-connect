import { NextRequest, NextResponse } from "next/server";

import { OrderStatus } from "@/../prisma/generated/client";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { serializeOrderWithDetails } from "@/lib/utils/order.utils";
import { orderRepository } from "@/repositories";
import { createErrorResponse, createSuccessResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const shop_id = await authUtils.getOwnedShopId();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const cursor = searchParams.get("cursor") || undefined;
    const searchTerm = searchParams.get("q") || undefined;
    const status = (searchParams.get("status") as OrderStatus) || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const hostel_block = searchParams.get("hostel_block") || undefined;

    if (!shop_id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { orders, nextCursor } = await orderRepository.getPaginatedShopOrders(
      {
        shop_id,
        limit,
        cursor,
        searchTerm,
        orderStatus: status,
        hostelBlock: hostel_block,
        dateRange:
          from && to ? { from: new Date(from), to: new Date(to) } : undefined,
      }
    );

    const successResponse = createSuccessResponse({
      orders: orders.map((order) => serializeOrderWithDetails(order)),
      nextCursor,
    });
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    const errorResponse = createErrorResponse("Internal Server Error");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
