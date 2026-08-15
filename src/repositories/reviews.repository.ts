import { Prisma, Review } from "@/generated/client";
import { BadRequestError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateReviewDto = Prisma.ReviewCreateInput;

export type UpdateReviewDto = Omit<Prisma.ReviewUpdateArgs, "where">;

export class ReviewRepository extends BaseRepository<
  Review,
  Prisma.ReviewFindUniqueArgs,
  Prisma.ReviewFindManyArgs,
  Prisma.ReviewCreateArgs,
  Prisma.ReviewUpdateArgs,
  Prisma.ReviewDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.review);
  }

  async createReview(
    data: CreateReviewDto,
    options?: Omit<Prisma.ReviewCreateArgs, "data">
  ) {
    const product_id = data.product.connect!.id;
    if (!product_id) {
      throw new BadRequestError("Product ID required for review");
    }
    return this.prismaClient.$transaction(async (tx) => {
      // `data` is re-applied after `...options` so it cannot be swapped out —
      // see the scope-hardening note in base.repository.ts.
      const review = await tx.review.create({ ...options, data });
      await tx.product.update({
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
    // Scope hardening — see base.repository.ts. `UpdateReviewDto` is
    // `Omit<ReviewUpdateArgs, "where">`, but that type is not enforced when
    // the caller's literal is inferred through a generic, so strip any
    // `where` and re-apply the id.
    const { where, ...rest } = data as Prisma.ReviewUpdateArgs;
    return this.prismaClient.review.update({
      ...rest,
      where: { ...where, id: review_id },
    });
  }

  async deleteReview(review_id: string) {
    return this.prismaClient.review.delete({ where: { id: review_id } });
  }

  async findById(review_id: string): Promise<Review | null>;
  async findById<T extends Omit<Prisma.ReviewFindUniqueArgs, "where">>(
    review_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.ReviewDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    review_id: string,
    options?: Prisma.ReviewFindUniqueArgs
  ): Promise<
    | Review
    | null
    | Prisma.Result<
        Prisma.ReviewDelegate,
        Omit<Prisma.ReviewFindUniqueArgs, "where"> & { where: { id: string } },
        "findUnique"
      >
  > {
    // Scope hardening — see base.repository.ts.
    const { where, ...rest } = options ?? {};
    const query = {
      ...rest,
      where: { ...where, id: review_id },
    };
    return this.prismaClient.review.findUnique(query);
  }

  async findByOrderItemId(order_item_id: string): Promise<Review | null>;
  async findByOrderItemId<T extends Omit<Prisma.ReviewFindUniqueArgs, "where">>(
    order_item_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.ReviewDelegate,
    T & { where: { order_item_id: string } },
    "findUnique"
  > | null>;
  async findByOrderItemId(
    order_item_id: string,
    options?: Prisma.ReviewFindUniqueArgs
  ): Promise<
    | Review
    | null
    | Prisma.Result<
        Prisma.ReviewDelegate,
        Omit<Prisma.ReviewFindUniqueArgs, "where"> & {
          where: { order_item_id: string };
        },
        "findUnique"
      >
  > {
    // Scope hardening — see base.repository.ts.
    const { where, ...rest } = options ?? {};
    const query = {
      ...rest,
      where: { ...where, order_item_id },
    };
    return this.prismaClient.review.findUnique(query);
  }

  async updateProductRatings(product_id: string, ratingDifference: number) {
    return this.prismaClient.product.update({
      where: { id: product_id },
      data: {
        rating_sum: { increment: ratingDifference },
      },
    });
  }

  async findAllReviewsByProductId(product_id: string): Promise<Review[]>;
  async findAllReviewsByProductId<
    T extends Omit<Prisma.ReviewFindManyArgs, "where">,
  >(
    product_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.ReviewDelegate,
      T & { where: { product_id: string } },
      "findMany"
    >
  >;
  async findAllReviewsByProductId(
    product_id: string,
    options?: Prisma.ReviewFindManyArgs
  ): Promise<
    | Review[]
    | Prisma.Result<
        Prisma.ReviewDelegate,
        Omit<Prisma.ReviewFindManyArgs, "where"> & {
          where: { product_id: string };
        },
        "findMany"
      >
  > {
    // Scope hardening — see base.repository.ts.
    const { where, ...rest } = options ?? {};
    return this.prismaClient.review.findMany({
      ...rest,
      where: { ...where, product_id },
    });
  }

  async getGroupedReviews(product_id: string) {
    return this.prismaClient.review.groupBy({
      by: ["rating"],
      where: { product_id },
      _count: {
        rating: true,
      },
      orderBy: {
        rating: "desc",
      },
    });
  }

  async getReviewStats(product_id: string) {
    return this.prismaClient.review.aggregate({
      where: { product_id },
      _avg: { rating: true },
      _count: { rating: true },
    });
  }

  async findMany<T extends Prisma.ReviewFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.ReviewDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.ReviewFindManyArgs): Promise<Review[]>;
  override async findMany(
    args?: Prisma.ReviewFindManyArgs
  ): Promise<
    | Review[]
    | Prisma.Result<
        Prisma.ReviewDelegate,
        Prisma.ReviewFindManyArgs,
        "findMany"
      >
  > {
    return this.prismaClient.review.findMany(args);
  }

  async findUnique<T extends Prisma.ReviewFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.ReviewDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.ReviewFindUniqueArgs
  ): Promise<Review | null>;
  override async findUnique(
    args: Prisma.ReviewFindUniqueArgs
  ): Promise<
    | Review
    | null
    | Prisma.Result<
        Prisma.ReviewDelegate,
        Prisma.ReviewFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.review.findUnique(args);
  }

  async count(args?: Prisma.ReviewCountArgs): Promise<number> {
    return this.prismaClient.review.count(args);
  }

  async deleteReviewWithRatingUpdate(
    review_id: string,
    product_id: string,
    rating: number
  ): Promise<void> {
    await this.prismaClient.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: review_id } });
      await tx.product.update({
        where: { id: product_id },
        data: {
          rating_sum: { decrement: rating },
          review_count: { decrement: 1 },
        },
      });
    });
  }

  async aggregate<T extends Prisma.ReviewAggregateArgs>(args: T) {
    return this.prismaClient.review.aggregate(args);
  }

  async groupBy(args: Prisma.ReviewGroupByArgs) {
    return this.prismaClient.review.groupBy({
      orderBy: undefined,
      ...args,
    });
  }
}
