"use server";

import { unauthorized } from "next/navigation";

import { runAction } from "@/actions/_shared/action-helpers";
import { reviewRepository, reviewService } from "@/di/container";
import { ForbiddenError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types";
const log = createLogger("review-action");

export const updateReviewAction = async ({
  review_id,
  product_id,
  rating,
  comment,
}: {
  review_id: string;
  product_id: string;
  rating: number;
  comment: string;
}) => {
  // Outside runAction: unauthorized() throws Next's 401 signal, which must
  // not be wrapped into an InternalServerError.
  const user_id = await authUtils.getUserId();
  if (!user_id) {
    return unauthorized();
  }

  return runAction(
    log,
    { label: "Error updating review:", fallback: "Failed to update review" },
    async () => {
      // The rating aggregate moves on the product the review is actually
      // about, never on a caller-supplied product_id.
      const existing = await reviewRepository.findById(review_id, {
        select: { product_id: true },
      });
      const review = await reviewService.updateReview(
        user_id,
        { rating, comment },
        existing?.product_id ?? product_id,
        review_id
      );

      return createSuccessResponse(review);
    }
  );
};

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
  const user_id = await authUtils.getUserId();
  if (!user_id) {
    return unauthorized();
  }

  return runAction(
    log,
    {
      label: "Error creating review:",
      fallback: "Failed to create review",
      passthrough: [ForbiddenError],
    },
    async () => {
      const review = await reviewService.createReview(
        { rating, comment },
        product_id,
        order_item_id,
        user_id
      );

      return createSuccessResponse(review);
    }
  );
};
