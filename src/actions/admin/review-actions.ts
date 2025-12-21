"use server";

import z from "zod";

import { Prisma } from "@/../prisma/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notification/notification.service";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { verifyAdmin } from "../authentication/admin";

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
  try {
    await verifyAdmin();

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

    const reviews = await prisma.review.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
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

    const hasMore = reviews.length > limit;
    const data = hasMore ? reviews.slice(0, -1) : reviews;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return createSuccessResponse(
      {
        data,
        nextCursor,
        hasMore,
      },
      "Reviews retrieved successfully"
    );
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve reviews.");
  }
}

export async function deleteReviewAction(
  reviewId: string
): Promise<ActionResponse<{ id: string; productId: string }>> {
  try {
    const adminId = await verifyAdmin();

    if (typeof reviewId !== "string" || reviewId.trim() === "") {
      throw new BadRequestError("Invalid review ID");
    }

    const review = await prisma.review.findUnique({
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
              select: { id: true, name: true, user: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    await prisma.$transaction([
      prisma.review.delete({ where: { id: reviewId } }),
      prisma.product.update({
        where: { id: review.product.id },
        data: {
          rating_sum: { decrement: review.rating },
          review_count: { decrement: 1 },
        },
      }),
    ]);

    await prisma.adminAuditLog.create({
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
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to delete review.");
  }
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
  try {
    await verifyAdmin();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalReviews, avgResult, ratingGroups, recentReviews] =
      await Promise.all([
        prisma.review.count(),
        prisma.review.aggregate({
          _avg: { rating: true },
        }),
        prisma.review.groupBy({
          by: ["rating"],
          _count: { rating: true },
          orderBy: { rating: "desc" },
        }),
        prisma.review.count({
          where: { created_at: { gte: sevenDaysAgo } },
        }),
      ]);

    return createSuccessResponse(
      {
        totalReviews,
        averageRating: avgResult._avg.rating ?? 0,
        ratingDistribution: ratingGroups.map((g) => ({
          rating: g.rating,
          count: g._count.rating,
        })),
        recentReviews,
      },
      "Review statistics retrieved successfully"
    );
  } catch (error) {
    console.error("GET REVIEW STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve review statistics.");
  }
}
