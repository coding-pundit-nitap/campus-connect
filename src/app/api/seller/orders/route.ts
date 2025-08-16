import { NextResponse } from "next/server";
import { auth } from "@/auth";
import orderServices from "@/services/order.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const shopId = session?.user?.shop_id;
    if (!shopId) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const orders = await orderServices.getOrdersByShopId(shopId);
    const successResponse = createSuccessResponse(
      orders,
      "Seller orders retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET SELLER ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
