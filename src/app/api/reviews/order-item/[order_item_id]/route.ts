import { authUtils } from "@/lib/utils/auth.utils.server";
import reviewRepository from "@/repositories/reviews.repository";
import { createErrorResponse,createSuccessResponse } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_item_id: string }> }
) {
  try {
    const user_id = await authUtils.getUserId();
    const { order_item_id } = await params;
    if (!user_id) {
      return Response.json(createErrorResponse("Unauthorized"), {
        status: 401,
      });
    }

    const review = await reviewRepository.findByOrderItemId(order_item_id, {
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!review) {
      return Response.json(createErrorResponse("Review not found"), {
        status: 404,
      });
    }

    return Response.json(createSuccessResponse(review));
  } catch (error) {
    console.error("Error fetching review:", error);
    return Response.json(createErrorResponse("Failed to fetch review"), {
      status: 500,
    });
  }
}
