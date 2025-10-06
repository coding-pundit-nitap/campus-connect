import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types";
import { ReviewWithUser } from "@/types/review.type";

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
    const url = `reviews/${product_id}?limit=5${cursor ? `&cursor=${cursor}` : ""}`;
    const response =
      await axiosInstance.get<ActionResponse<PaginatedReviewResponse>>(url);
    return response.data.data;
  }
}

export const reviewApiService = new ReviewApiService();

export default reviewApiService;
