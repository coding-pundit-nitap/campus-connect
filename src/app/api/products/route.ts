import { NextRequest } from "next/server";

import { UnauthenticatedError } from "@/lib/custom-error";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { productService } from "@/services/product/product.service";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { paginatedSchema } from "@/validations/broadcast";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = Object.fromEntries(searchParams);
    const validation = paginatedSchema.safeParse(params);

    if (!validation.success) {
      return jsonResponse(createErrorResponse("Invalid query parameters"), 400);
    }

    const { limit, cursor } = validation.data;

    const response = await productService.getPaginatedProducts({
      limit,
      cursor,
    });

    const successResponse = createSuccessResponse(response);
    return jsonResponse(successResponse, 200);
  } catch (error) {
    console.error("Error fetching Products: ", error);

    if (error instanceof UnauthenticatedError) {
      return jsonResponse(createErrorResponse(error.message), 401);
    }
    const errorResponse = createErrorResponse("Failed to fetch products");
    return jsonResponse(errorResponse, 500);
  }
}
