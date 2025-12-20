import { Prisma, Review } from "@/../prisma/generated/client";
import { BadRequestError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";

export type CreateReviewDto = Prisma.ReviewCreateInput;

export type UpdateReviewDto = Omit<Prisma.ReviewUpdateArgs, "where">;

class ReviewRepository {
  async createReview(
    data: CreateReviewDto,
    options?: Omit<Prisma.ReviewCreateArgs, "data">
  ) {
    const product_id = data.product.connect!.id;
    if (!product_id) {
      throw new BadRequestError("Product ID required for review");
    }
    return prisma.$transaction(async (prisma) => {
      const review = await prisma.review.create({ data, ...options });
      await prisma.product.update({
        where: { id: product_id },
        data: {
          rating_sum: { increment: data.rating },
          review_count: { increment: 1 },
        },
      });
      return review;
    });
  }

  async updateReview(review_id: string, data: UpdateReviewDto) {
    return prisma.review.update({ where: { id: review_id }, ...data });
  }

  async deleteReview(review_id: string) {
    return prisma.review.delete({ where: { id: review_id } });
  }
  async findAllReviewsByProductId(product_id: string): Promise<Review[]>;
  async findAllReviewsByProductId<T extends Prisma.ReviewFindManyArgs>(
    product_id: string,
    options: T
  ): Promise<Prisma.ReviewGetPayload<T>[]>;
  async findAllReviewsByProductId(
    product_id: string,
    options?: Prisma.ReviewFindManyArgs
  ): Promise<Review[] | Prisma.ReviewGetPayload<Prisma.ReviewFindManyArgs>[]> {
    const query = { ...(options ?? {}) };
    return prisma.review.findMany({
      where: { product_id },
      ...query,
    });
  }
  async getGroupedReviews(product_id: string) {
    return prisma.review.groupBy({
      by: ["rating"],
      where: { product_id },
      _count: {
        rating: true,
      },
      orderBy: {
        rating: "desc", // so it lists 5 stars first
      },
    });
  }
  async getReviewStats(product_id: string) {
    return prisma.review.aggregate({
      where: { product_id },
      _avg: { rating: true },
      _count: { rating: true },
    });
  }
}

export const reviewRepository = new ReviewRepository();
export default reviewRepository;
