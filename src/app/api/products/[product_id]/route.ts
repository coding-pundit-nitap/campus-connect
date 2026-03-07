import { NextRequest } from "next/server";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { serializeProduct } from "@/lib/utils";
import { productService } from "@/services/product/product.service";
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
      return jsonResponse(errorResponse, 404);
    }
    const successResponse = createSuccessResponse<SerializedProductDetail>(
      {
        ...serializeProduct(product),
        shop: { name: product.shop.name, id: product.shop.id },
      },
      "Product retrieved successfully"
    );

    return jsonResponse(successResponse, 200);
  } catch (error) {
    console.log("GET PRODUCT ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
