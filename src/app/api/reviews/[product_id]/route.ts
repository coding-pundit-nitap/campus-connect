import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/../prisma/generated/client";
import reviewRepository from "@/repositories/reviews.repository";
import { createSuccessResponse } from "@/types";
import { ReviewWithUser } from "@/types/review.type";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ product_id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor");
    const queryOptions = {
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        created_at: Prisma.SortOrder.desc,
      },
    };

    const reviewsData: ReviewWithUser[] =
      await reviewRepository.findAllReviewsByProductId(
        (await params).product_id,
        queryOptions
      );

    let nextCursor: typeof cursor | null = null;
    if (reviewsData.length > limit) {
      const lastItem = reviewsData.pop();
      nextCursor = lastItem!.id;
    }
    const responseData = {
      reviews: reviewsData,
      nextCursor,
    };
    const successResponse = createSuccessResponse(
      responseData,
      "Reviews retrieved successfully"
    );
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error fetching paginated reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
