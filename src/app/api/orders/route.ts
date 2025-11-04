import { NextResponse } from "next/server";

import authUtils from "@/lib/utils/auth.utils.server";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import orderRepository from "@/repositories/order.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return NextResponse.json(createErrorResponse("User not authenticated"), {
        status: 401,
      });
    }

    const orders = await orderRepository.getOrdersByUserId(user_id, {
      include: orderWithDetailsInclude,
    });
    const successResponse = createSuccessResponse(
      orders.map(serializeOrderWithDetails),
      "Orders retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
