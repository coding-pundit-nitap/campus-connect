import { NextRequest, NextResponse } from "next/server";

import { serializeProduct } from "@/lib/utils-functions";
import productService from "@/services/product.service";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { SerializedProductDetail } from "@/types/product.types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ product_id: string }> }
) {
  try {
    const { product_id } = await params;

    const product = await productService.getProductById(product_id);

    if (!product) {
      const errorResponse = createErrorResponse("Product not found");
      return NextResponse.json(errorResponse, { status: 404 });
    }
    const successResponse = createSuccessResponse<SerializedProductDetail>(
      {
        ...serializeProduct(product),
        shop: { name: product.shop.name, id: product.shop.id },
      },
      "Product retrieved successfully"
    );

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.log("GET PRODUCT ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
