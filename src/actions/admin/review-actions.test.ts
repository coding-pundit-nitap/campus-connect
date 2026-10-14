import type { PrismaMock } from "@tests/helpers";
import {
  ADMIN_ID,
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
  rows,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { container, notificationService } from "@/di/container";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";

import {
  deleteReviewAction,
  getAllReviewsAction,
  getReviewStatsAction,
} from "./review-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const reviews = vi.mocked(container.reviewRepository);
const db = container.db as unknown as PrismaMock;

const review = {
  id: "rev-1",
  rating: 4,
  comment: "x".repeat(150),
  user: { id: "user-1", name: "Ann" },
  product: { id: "prod-1", name: "Tea" },
};

describe("admin review actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllReviewsAction", () => {
    itGuardsAdminAccess(
      () => getAllReviewsAction({ limit: 10 }),
      "Failed to retrieve reviews."
    );

    it("returns a page without filters", async () => {
      reviews.findMany.mockResolvedValue(rows(1, "r") as never);

      const res = await getAllReviewsAction({ limit: 10 });

      expect(reviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 11, skip: 0 })
      );
      expect(res.data).toEqual({
        data: rows(1, "r"),
        nextCursor: null,
        hasMore: false,
      });
    });

    it("applies rating, product, user, search and cursor", async () => {
      reviews.findMany.mockResolvedValue(rows(2, "r") as never);

      const res = await getAllReviewsAction({
        limit: 1,
        cursor: CURSOR,
        rating: 5,
        product_id: "prod-1",
        user_id: "user-1",
        search: "good",
      });

      expect(reviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            rating: 5,
            product_id: "prod-1",
            user_id: "user-1",
            OR: [
              { comment: { contains: "good", mode: "insensitive" } },
              { user: { name: { contains: "good", mode: "insensitive" } } },
              { product: { name: { contains: "good", mode: "insensitive" } } },
            ],
          },
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.nextCursor).toBe("r-1");
    });

    it("rejects an out-of-range rating with BadRequestError", async () => {
      await expect(
        getAllReviewsAction({ limit: 10, rating: 9 })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("deleteReviewAction", () => {
    itGuardsAdminAccess(
      () => deleteReviewAction("rev-1"),
      "Failed to delete review."
    );

    it("deletes the review, adjusts product rating, audits and notifies", async () => {
      reviews.findUnique.mockResolvedValue(review as never);

      const res = await deleteReviewAction("rev-1");

      expect(db.review.delete).toHaveBeenCalledWith({ where: { id: "rev-1" } });
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          rating_sum: { decrement: 4 },
          review_count: { decrement: 1 },
        },
      });
      expect(container.adminAuditRepository.create).toHaveBeenCalledWith({
        data: {
          admin_id: ADMIN_ID,
          action: "USER_DELETE",
          target_type: "REVIEW",
          target_id: "rev-1",
          details: {
            product_name: "Tea",
            user_name: "Ann",
            rating: 4,
            comment_preview: "x".repeat(100),
          },
        },
      });
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ title: "Review Removed" })
      );
      expect(res.data).toEqual({ id: "rev-1", productId: "prod-1" });
    });

    it("rejects a blank id with BadRequestError", async () => {
      await expect(deleteReviewAction("")).rejects.toThrow(BadRequestError);
      expect(reviews.findUnique).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown review", async () => {
      reviews.findUnique.mockResolvedValue(null);

      await expect(deleteReviewAction("rev-1")).rejects.toThrow(NotFoundError);
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("getReviewStatsAction", () => {
    itGuardsAdminAccess(
      () => getReviewStatsAction(),
      "Failed to retrieve review statistics."
    );

    it("aggregates totals, average and distribution", async () => {
      reviews.count.mockResolvedValueOnce(12).mockResolvedValueOnce(3);
      reviews.aggregate.mockResolvedValue({ _avg: { rating: 4.2 } } as never);
      reviews.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 8 } },
        { rating: 4, _count: true },
      ] as never);

      const res = await getReviewStatsAction();

      expect(res.data).toEqual({
        totalReviews: 12,
        averageRating: 4.2,
        ratingDistribution: [
          { rating: 5, count: 8 },
          { rating: 4, count: 0 },
        ],
        recentReviews: 3,
      });
    });

    it("defaults the average to zero when there are no reviews", async () => {
      reviews.count.mockResolvedValue(0);
      reviews.aggregate.mockResolvedValue({ _avg: { rating: null } } as never);
      reviews.groupBy.mockResolvedValue([] as never);

      const res = await getReviewStatsAction();

      expect(res.data?.averageRating).toBe(0);
    });
  });
});
