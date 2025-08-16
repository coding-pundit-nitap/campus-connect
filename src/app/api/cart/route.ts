import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import cartServices from "@/services/cart.services";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/types/response.type";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get("shop_id");

    if (!shop_id) {
      const errorResponse = createErrorResponse(
        "shop_id query parameter is required"
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const cart = await cartServices.getCartForShop(session.user.id, shop_id);
    const successResponse = createSuccessResponse(
      cart,
      "Cart retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET CART ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

const upsertItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      const errorResponse = createErrorResponse("Unauthorized");
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const body = await request.json();
    const validation = upsertItemSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = createErrorResponse("Invalid input data");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { product_id, quantity } = validation.data;

    const updatedCart = await cartServices.upsertCartItem(
      session.user.id,
      product_id,
      quantity
    );
    const successResponse = createSuccessResponse(
      updatedCart,
      "Cart updated successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("UPSERT CART ITEM ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
