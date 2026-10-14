import { NextRequest } from "next/server";
import z from "zod";

import { zodErrorResponse } from "@/app/api/_lib/route-helpers";
import { reviewRepository } from "@/di/container";
import { Prisma } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { paginateCursor } from "@/lib/paginate";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { ReviewWithUser } from "@/types/review.type";
import { cursorPaginationSchema } from "@/validations/pagination.validation";
const log = createLogger("route");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ product_id: string }> }
) {
  try {
    const { product_id } = await params;
    const searchParams = Object.fromEntries(new URL(request.url).searchParams);

    const parsed = cursorPaginationSchema.parse(searchParams);

    const result = await paginateCursor(
      ({ take, cursor }) =>
        reviewRepository.findAllReviewsByProductId(product_id, {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          take,
          cursor: cursor ? { id: cursor } : undefined,
          skip: cursor ? 1 : 0,
          // id breaks created_at ties so the cursor order is stable.
          orderBy: [
            { created_at: Prisma.SortOrder.desc },
            { id: Prisma.SortOrder.desc },
          ],
        }) as Promise<ReviewWithUser[]>,
      parsed.limit,
      parsed.cursor
    );

    const successResponse = createSuccessResponse(
      {
        ...result,
        reviews: result.data,
      },
      "Reviews retrieved successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(error);
    }
    log.error({ err: error }, "Error fetching paginated reviews:");
    return jsonResponse(createErrorResponse("Failed to fetch reviews"), 500);
  }
}
