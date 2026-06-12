import { NextRequest } from "next/server";
import { z } from "zod";

import { productService } from "@/di/container";
import { UnauthenticatedError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { paginatedSchema } from "@/validations/broadcast";
const log = createLogger("route");

export const dynamic = "force-dynamic";

const productsQuerySchema = paginatedSchema.extend({
  categoryId: z.string().optional(),
  hasDiscount: z
    .preprocess((val) => val === "true" || val === "1", z.coerce.boolean())
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = Object.fromEntries(searchParams);
    const validation = productsQuerySchema.safeParse(params);

    if (!validation.success) {
      log.debug(`Validation error:  ${validation.error}`);
      return jsonResponse(createErrorResponse("Invalid query parameters"), 400);
    }

    const { limit, cursor, categoryId, hasDiscount } = validation.data;

    const response = await productService.getPaginatedProducts({
      limit,
      cursor,
      categoryId,
      hasDiscount,
    });

    const successResponse = createSuccessResponse(response);
    return jsonResponse(successResponse, 200);
  } catch (error) {
    log.error({ err: error }, "Error fetching Products: ");

    if (error instanceof UnauthenticatedError) {
      return jsonResponse(createErrorResponse(error.message), 401);
    }
    const errorResponse = createErrorResponse("Failed to fetch products");
    return jsonResponse(errorResponse, 500);
  }
}
