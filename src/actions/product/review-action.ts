"use server";

import { InternalServerError, UnauthenticatedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils-functions/auth.utils";
import reviewService from "@/services/review.service";
import { createSuccessResponse } from "@/types";

export const createReviewAction = async ({
  product_id,
  order_item_id,
  rating,
  comment,
}: {
  product_id: string;
  order_item_id: string;
  rating: number;
  comment: string;
}) => {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthenticatedError("User not authenticated");
    }

    const review = await reviewService.createReview(
      { rating, comment },
      product_id,
      order_item_id,
      user_id
    );

    return createSuccessResponse(review);
  } catch (error) {
    console.log("Error creating review:", error);
    throw new InternalServerError("Failed to create review");
  }
};
