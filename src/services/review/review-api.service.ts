import { ReviewWithUser } from "@/types/review.type";

import { apiGet } from "../api-client";

export interface PaginatedReviewResponse {
  data: ReviewWithUser[];
  nextCursor: string | null;
}
class ReviewApiService {
  async fetchReviews({
    product_id,
    cursor,
  }: {
    cursor?: string | null;
    product_id: string;
  }) {
    return apiGet<PaginatedReviewResponse>(`reviews/${product_id}`, {
      params: { limit: 5, cursor: cursor || undefined },
    });
  }

  async fetchReviewByOrderItemId(order_item_id: string) {
    return apiGet<ReviewWithUser | null>(`reviews/order-item/${order_item_id}`);
  }
}

export const reviewApiService = new ReviewApiService();

export default reviewApiService;
