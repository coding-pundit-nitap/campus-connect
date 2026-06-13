import z from "zod";

import { shopRepository } from "@/di/container";
import { Prisma } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { paginateCursor } from "@/lib/paginate";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { formatShopData } from "@/lib/shop-utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { cursorPaginationSchema } from "@/validations/pagination.validation";
const log = createLogger("route");

export async function GET(request: Request) {
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = cursorPaginationSchema.parse(searchParams);

    const result = await paginateCursor(
      ({ take, cursor }) =>
        shopRepository.getShops({
          where: { is_active: true, deleted_at: null },
          include: { user: { select: { name: true, email: true } } },
          take,
          cursor: cursor ? { id: cursor } : undefined,
          skip: cursor ? 1 : 0,
          orderBy: {
            created_at: Prisma.SortOrder.desc,
          },
        }),
      parsed.limit,
      parsed.cursor
    );

    const formattedResult = {
      ...result,
      data: result.data.map(formatShopData),
    };

    const successResponse = createSuccessResponse(
      formattedResult,
      "Shops retrieved successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(
        createErrorResponse(error.issues.map((e) => e.message).join(", ")),
        400
      );
    }
    log.error({ err: error }, "GET SHOPS ERROR:");
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
