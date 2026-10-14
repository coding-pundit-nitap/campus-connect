"use server";

import z from "zod";

import { container, notificationService } from "@/di/container";
import { Prisma } from "@/generated/client";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import {
  cursorArgs,
  groupCount,
  runAdminAction,
  toCursorPage,
} from "./_shared";
const log = createLogger("review-actions");

const getReviewsSchema = searchSchema.extend({
  rating: z.coerce.number().min(1).max(5).optional(),
  product_id: z.string().optional(),
  user_id: z.string().optional(),
});

export type ReviewEntry = {
  id: string;
  rating: number;
  comment: string;
  created_at: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    shop: {
      id: string;
      name: string;
    };
  };
};

export async function getAllReviewsAction(
  options: z.infer<typeof getReviewsSchema>
): Promise<ActionResponse<CursorPaginatedResponse<ReviewEntry>>> {
  return runAdminAction(
    log,
    {
      label: "GET REVIEWS ERROR:",
      fallback: "Failed to retrieve reviews.",
    },
    async () => {
      const parsedData = getReviewsSchema.safeParse(options);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid options");
      }

      const { limit, cursor, search, rating, product_id, user_id } =
        parsedData.data;

      const where: Prisma.ReviewWhereInput = {};

      if (rating) {
        where.rating = rating;
      }

      if (product_id) {
        where.product_id = product_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (search) {
        where.OR = [
          { comment: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { product: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const reviews = await container.reviewRepository.findMany({
        where,
        ...cursorArgs(limit, cursor),
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          created_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      const { data, nextCursor, hasMore } = toCursorPage(reviews, limit);

      return createSuccessResponse(
        {
          data,
          nextCursor,
          hasMore,
        },
        "Reviews retrieved successfully"
      );
    }
  );
}

export async function deleteReviewAction(
  reviewId: string
): Promise<ActionResponse<{ id: string; productId: string }>> {
  return runAdminAction(
    log,
    {
      label: "DELETE REVIEW ERROR:",
      fallback: "Failed to delete review.",
      passthrough: [NotFoundError],
    },
    async (adminId) => {
      if (typeof reviewId !== "string" || reviewId.trim() === "") {
        throw new BadRequestError("Invalid review ID");
      }

      const review = await container.reviewRepository.findUnique({
        where: { id: reviewId },
        include: {
          user: { select: { id: true, name: true } },
          product: {
            select: {
              id: true,
              name: true,
              rating_sum: true,
              review_count: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                  user: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!review) {
        throw new NotFoundError("Review not found");
      }

      await container.db.$transaction(async (tx) => {
        await tx.review.delete({ where: { id: reviewId } });
        await tx.product.update({
          where: { id: review.product.id },
          data: {
            rating_sum: { decrement: review.rating },
            review_count: { decrement: 1 },
          },
        });
      });

      await container.adminAuditRepository.create({
        data: {
          admin_id: adminId,
          action: "USER_DELETE",
          target_type: "REVIEW",
          target_id: reviewId,
          details: {
            product_name: review.product.name,
            user_name: review.user.name,
            rating: review.rating,
            comment_preview: review.comment.slice(0, 100),
          },
        },
      });

      await notificationService.publishNotification(review.user.id, {
        title: "Review Removed",
        message: `Your review on "${review.product.name}" has been removed by an administrator.`,
        type: "WARNING",
        category: "SYSTEM",
      });

      return createSuccessResponse(
        {
          id: reviewId,
          productId: review.product.id,
        },
        "Review deleted successfully"
      );
    }
  );
}

export type ReviewStats = {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  recentReviews: number;
};

export async function getReviewStatsAction(): Promise<
  ActionResponse<ReviewStats>
> {
  return runAdminAction(
    log,
    {
      label: "GET REVIEW STATS ERROR:",
      fallback: "Failed to retrieve review statistics.",
    },
    async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [totalReviews, avgResult, ratingGroups, recentReviews] =
        await Promise.all([
          container.reviewRepository.count(),
          container.reviewRepository.aggregate({
            _avg: { rating: true },
          }),
          container.reviewRepository.groupBy({
            by: ["rating"],
            _count: { rating: true },
            orderBy: { rating: "desc" },
          }),
          container.reviewRepository.count({
            where: { created_at: { gte: sevenDaysAgo } },
          }),
        ]);

      return createSuccessResponse(
        {
          totalReviews,
          averageRating: avgResult._avg?.rating ?? 0,
          ratingDistribution: ratingGroups.map((g) => ({
            rating: g.rating,
            count: groupCount(g._count, "rating"),
          })),
          recentReviews,
        },
        "Review statistics retrieved successfully"
      );
    }
  );
}
