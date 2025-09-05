import { NextRequest, NextResponse } from "next/server";

import authUtils from "@/lib/utils-functions/auth.utils";
import orderRepository from "@/repositories/order.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const config = {
  runtime: "edge",
};
export async function GET(_request: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return NextResponse.json(createErrorResponse("User not authenticated"), {
        status: 401,
      });
    }

    const orders = await orderRepository.getOrdersByUserId(user_id, {
      include: { items: true, shop: true },
    });

    return NextResponse.json(createSuccessResponse(orders));
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return NextResponse.json(
      createErrorResponse("An internal server error occurred."),
      { status: 500 }
    );
  }
}
