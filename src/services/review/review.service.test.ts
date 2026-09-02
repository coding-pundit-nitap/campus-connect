import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/lib/custom-error";
import type { prisma } from "@/lib/prisma";
import type { ProductRepository } from "@/repositories/product.repository";
import type { ReviewRepository } from "@/repositories/reviews.repository";
import type { NotificationService } from "@/services/notification/notification.service";

import { ReviewService } from "./review.service";

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("ReviewService", () => {
  let service: ReviewService;
  let productRepo: {
    findById: ReturnType<typeof vi.fn>;
  };
  let reviewRepo: {
    createReview: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateReview: ReturnType<typeof vi.fn>;
    updateProductRatings: ReturnType<typeof vi.fn>;
  };
  let notificationService: {
    publishNotification: ReturnType<typeof vi.fn>;
  };
  let prismaClient: {
    orderItem: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    productRepo = {
      findById: vi.fn(),
    };
    reviewRepo = {
      createReview: vi.fn(),
      findById: vi.fn(),
      updateReview: vi.fn(),
      updateProductRatings: vi.fn(),
    };
    notificationService = {
      publishNotification: vi.fn(),
    };
    prismaClient = {
      orderItem: {
        findUnique: vi.fn(),
      },
    };

    service = new ReviewService(
      productRepo as unknown as ProductRepository,
      reviewRepo as unknown as ReviewRepository,
      notificationService as unknown as NotificationService,
      prismaClient as unknown as typeof prisma
    );
  });

  describe("createReview", () => {
    it("should create a review successfully and notify shop owner", async () => {
      prismaClient.orderItem.findUnique.mockResolvedValue({
        product_id: "prod-1",
        order: { user_id: "user-1" },
      });
      reviewRepo.createReview.mockResolvedValue({ id: "rev-1" });
      productRepo.findById.mockResolvedValue({
        id: "prod-1",
        name: "Prod 1",
        shop: { user: { id: "shop-owner-1" } },
      });

      const result = await service.createReview(
        { rating: 5, comment: "Great!" },
        "prod-1",
        "order-item-1",
        "user-1"
      );

      expect(prismaClient.orderItem.findUnique).toHaveBeenCalledWith({
        where: { id: "order-item-1" },
        select: expect.any(Object),
      });
      expect(reviewRepo.createReview).toHaveBeenCalled();
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "shop-owner-1",
        expect.any(Object)
      );
      expect(result).toEqual({ id: "rev-1" });
    });

    it("should throw ForbiddenError if order item not found or user mismatch", async () => {
      prismaClient.orderItem.findUnique.mockResolvedValue({
        product_id: "prod-1",
        order: { user_id: "other-user" },
      });

      await expect(
        service.createReview(
          { rating: 5, comment: "Great!" },
          "prod-1",
          "order-item-1",
          "user-1"
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("updateReview", () => {
    it("should update review and product ratings", async () => {
      reviewRepo.findById.mockResolvedValue({ user_id: "user-1", rating: 3 });
      reviewRepo.updateReview.mockResolvedValue({ id: "rev-1", rating: 5 });

      await service.updateReview(
        "user-1",
        { rating: 5, comment: "Updated" },
        "prod-1",
        "rev-1"
      );

      expect(reviewRepo.updateReview).toHaveBeenCalledWith("rev-1", {
        data: { comment: "Updated", rating: 5 },
      });
      expect(reviewRepo.updateProductRatings).toHaveBeenCalledWith("prod-1", 2); // 5 - 3 = 2
    });

    it("should throw Error if review not found or user mismatch", async () => {
      reviewRepo.findById.mockResolvedValue({
        user_id: "other-user",
        rating: 3,
      });

      await expect(
        service.updateReview(
          "user-1",
          { rating: 5, comment: "Updated" },
          "prod-1",
          "rev-1"
        )
      ).rejects.toThrow("Review not found");
    });
  });
});
