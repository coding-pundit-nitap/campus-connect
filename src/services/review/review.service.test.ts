import {
  asPrisma,
  createPrismaMock,
  mockOf,
  type PrismaMock,
} from "@tests/helpers";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import { ForbiddenError } from "@/lib/custom-error";
import type { ProductRepository } from "@/repositories/product.repository";
import type { ReviewRepository } from "@/repositories/reviews.repository";
import type { NotificationService } from "@/services/notification/notification.service";

import { ReviewService } from "./review.service";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const form = { rating: 5, comment: "Great!" };

describe("ReviewService", () => {
  let service: ReviewService;
  let productRepo: Mocked<ProductRepository>;
  let reviewRepo: Mocked<ReviewRepository>;
  let notificationService: Mocked<NotificationService>;
  let prisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    productRepo = mockOf<ProductRepository>();
    reviewRepo = mockOf<ReviewRepository>();
    notificationService = mockOf<NotificationService>();
    prisma = createPrismaMock();
    service = new ReviewService(
      productRepo,
      reviewRepo,
      notificationService,
      asPrisma(prisma)
    );
  });

  describe("createReview", () => {
    const create = () =>
      service.createReview(form, "prod-1", "order-item-1", "user-1");

    beforeEach(() => {
      prisma.orderItem.findUnique.mockResolvedValue({
        product_id: "prod-1",
        order: { user_id: "user-1" },
      });
      reviewRepo.createReview.mockResolvedValue({ id: "rev-1" } as never);
    });

    it("creates the review and notifies the shop owner", async () => {
      productRepo.findById.mockResolvedValue({
        id: "prod-1",
        name: "Prod 1",
        shop: { user: { id: "owner-1" } },
      } as never);

      await expect(create()).resolves.toEqual({ id: "rev-1" });

      expect(prisma.orderItem.findUnique).toHaveBeenCalledWith({
        where: { id: "order-item-1" },
        select: { product_id: true, order: { select: { user_id: true } } },
      });
      expect(reviewRepo.createReview).toHaveBeenCalledWith({
        comment: "Great!",
        rating: 5,
        product: { connect: { id: "prod-1" } },
        user: { connect: { id: "user-1" } },
        order_item: { connect: { id: "order-item-1" } },
      });
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "owner-1",
        {
          title: "New Review on Your Product",
          message: "Your product Prod 1 has received a new review.",
          action_url: "/product/prod-1",
          type: "INFO",
        }
      );
    });

    it.each([
      ["the product is gone", null],
      ["the product has no shop", { id: "prod-1", shop: null }],
      ["the shop has no owner", { id: "prod-1", shop: { user: null } }],
    ])("skips the notification when %s", async (_label, product) => {
      productRepo.findById.mockResolvedValue(product as never);

      await expect(create()).resolves.toEqual({ id: "rev-1" });
      expect(notificationService.publishNotification).not.toHaveBeenCalled();
    });

    it.each([
      ["the order item does not exist", null],
      [
        "the order belongs to another user",
        { product_id: "prod-1", order: { user_id: "other" } },
      ],
      [
        "the order item is for another product",
        { product_id: "prod-2", order: { user_id: "user-1" } },
      ],
    ])("throws ForbiddenError when %s", async (_label, orderItem) => {
      prisma.orderItem.findUnique.mockResolvedValue(orderItem);

      await expect(create()).rejects.toBeInstanceOf(ForbiddenError);
      expect(reviewRepo.createReview).not.toHaveBeenCalled();
    });
  });

  describe("updateReview", () => {
    const update = (rating = 5) =>
      service.updateReview(
        "user-1",
        { rating, comment: "Updated" },
        "prod-1",
        "rev-1"
      );

    it("updates the review and shifts product ratings by the difference", async () => {
      reviewRepo.findById.mockResolvedValue({
        user_id: "user-1",
        rating: 3,
      } as never);
      reviewRepo.updateReview.mockResolvedValue({ id: "rev-1" } as never);

      await expect(update()).resolves.toEqual({ id: "rev-1" });

      expect(reviewRepo.findById).toHaveBeenCalledWith("rev-1", {
        select: { user_id: true, rating: true },
      });
      expect(reviewRepo.updateReview).toHaveBeenCalledWith("rev-1", {
        data: { comment: "Updated", rating: 5 },
      });
      expect(reviewRepo.updateProductRatings).toHaveBeenCalledWith("prod-1", 2);
    });

    it("leaves product ratings alone when the rating is unchanged", async () => {
      reviewRepo.findById.mockResolvedValue({
        user_id: "user-1",
        rating: 5,
      } as never);

      await update(5);

      expect(reviewRepo.updateProductRatings).not.toHaveBeenCalled();
    });

    it.each([
      ["missing", null],
      ["owned by someone else", { user_id: "other", rating: 3 }],
    ])("throws when the review is %s", async (_label, review) => {
      reviewRepo.findById.mockResolvedValue(review as never);

      await expect(update()).rejects.toThrow("Review not found");
      expect(reviewRepo.updateReview).not.toHaveBeenCalled();
    });
  });
});
