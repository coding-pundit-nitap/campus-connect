import { ReviewFormData } from "@/components/orders/review-form";
import { ProductRepository } from "@/repositories/product.repository";
import { ReviewRepository } from "@/repositories/reviews.repository";
import { NotificationService } from "@/services/notification/notification.service";

export class ReviewService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly notificationService: NotificationService
  ) {}

  async createReview(
    data: ReviewFormData,
    product_id: string,
    order_item_id: string,
    user_id: string
  ) {
    const review = await this.reviewRepository.createReview({
      comment: data.comment,
      rating: data.rating,
      product: { connect: { id: product_id } },
      user: { connect: { id: user_id } },
      order_item: { connect: { id: order_item_id } },
    });
    const product = await this.productRepository.findById(product_id, {
      include: { shop: { include: { user: { select: { id: true } } } } },
    });
    if (product && product.shop && product.shop.user) {
      await this.notificationService.publishNotification(product.shop.user.id, {
        title: "New Review on Your Product",
        message: `Your product ${product.name} has received a new review.`,
        action_url: `/product/${product.id}`,
        type: "INFO",
      });
    }
    return review;
  }

  async updateReview(
    user_id: string,
    data: ReviewFormData,
    product_id: string,
    review_id: string
  ) {
    const existingReview = await this.reviewRepository.findById(review_id, {
      select: { user_id: true, rating: true },
    });
    if (!existingReview || existingReview.user_id !== user_id) {
      throw new Error("Review not found");
    }

    const ratingDifference = data.rating - existingReview.rating;

    const review = await this.reviewRepository.updateReview(review_id, {
      data: {
        comment: data.comment,
        rating: data.rating,
      },
    });

    if (ratingDifference !== 0) {
      await this.reviewRepository.updateProductRatings(
        product_id,
        ratingDifference
      );
    }

    return review;
  }
}
