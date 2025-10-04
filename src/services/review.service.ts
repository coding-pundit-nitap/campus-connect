import { ReviewFormData } from "@/components/shops/review-form";
import productRepository from "@/repositories/product.repository";
import reviewRepository from "@/repositories/reviews.repository";

import { notificationService } from "./notification.service";

class ReviewService {
  async createReview(
    data: ReviewFormData,
    product_id: string,
    user_id: string
  ) {
    const review = await reviewRepository.createReview({
      comment: data.comment,
      rating: data.rating,
      product: { connect: { id: product_id } },
      user: { connect: { id: user_id } },
    });
    const product = await productRepository.findById(product_id, {
      include: { shop: true },
    });
    if (product && product.shop) {
      await notificationService.publishNotification(product.shop.owner_id, {
        title: "New Review on Your Product",
        message: `Your product ${product.name} has received a new review.`,
        action_url: `/shops/${product.shop.id}?product=${product.id}`,
        type: "INFO",
      });
    }
    return review;
  }
}

export const reviewService = new ReviewService();
export default reviewService;
