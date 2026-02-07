import { NextRequest, NextResponse } from "next/server";
import z from "zod";

import { Prisma } from "@/generated/client";
import { paginateCursor } from "@/lib/paginate";
import reviewRepository from "@/repositories/reviews.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { ReviewWithUser } from "@/types/review.type";
import { cursorPaginationSchema } from "@/validations/pagination.validation";

export const dynamic = "force-dynamic";

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
          orderBy: {
            created_at: Prisma.SortOrder.desc,
          },
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
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(error.issues.map((e) => e.message).join(", ")),
        { status: 400 }
      );
    }
    console.error("Error fetching paginated reviews:", error);
    return NextResponse.json(createErrorResponse("Failed to fetch reviews"), {
      status: 500,
    });
  }
}
