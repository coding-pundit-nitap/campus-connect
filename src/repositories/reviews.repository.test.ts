import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import { BadRequestError } from "@/lib/custom-error";
import { ReviewRepository } from "@/repositories/reviews.repository";

describe("ReviewRepository", () => {
  let prisma: PrismaMock;
  // Separate double for the interactive-transaction client, so tests prove
  // the writes go through `tx` and not the outer client.
  let tx: PrismaMock;
  let repo: ReviewRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    tx = createPrismaMock();
    prisma.$transaction.mockImplementation(
      async (fn: (t: PrismaMock) => unknown) => fn(tx)
    );
    tx.review.create.mockResolvedValue({ id: "review-1" });
    repo = new ReviewRepository(asPrisma(prisma));
  });

  describe("createReview", () => {
    it("throws BadRequestError if product_id is missing in data", async () => {
      const data = {
        rating: 5,
        product: { connect: {} },
      } as unknown as Prisma.ReviewCreateInput;
      await expect(repo.createReview(data)).rejects.toThrow(BadRequestError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each([
      ["product.connect is absent", { create: { name: "x" } }],
      ["product is absent", undefined],
    ])(
      "throws BadRequestError (not TypeError) when %s",
      async (_label, product) => {
        const data = {
          rating: 5,
          product,
        } as unknown as Prisma.ReviewCreateInput;
        await expect(repo.createReview(data)).rejects.toThrow(BadRequestError);
        expect(prisma.$transaction).not.toHaveBeenCalled();
      }
    );

    it("creates review and increments product rating/count in transaction", async () => {
      const data = {
        rating: 4,
        product: { connect: { id: "prod-1" } },
      } as unknown as Prisma.ReviewCreateInput;
      const result = await repo.createReview(data, {
        include: { user: true },
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.review.create).toHaveBeenCalledWith({
        include: { user: true },
        data,
      });
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          rating_sum: { increment: 4 },
          review_count: { increment: 1 },
        },
      });
      expect(prisma.review.create).not.toHaveBeenCalled();
      expect(result).toEqual({ id: "review-1" });
    });

    it("throws BadRequestError when the connected product id is empty", async () => {
      const data = {
        rating: 3,
        product: { connect: { id: "" } },
      } as unknown as Prisma.ReviewCreateInput;
      await expect(repo.createReview(data)).rejects.toThrow(
        "Product ID required for review"
      );
    });
  });

  describe("updateReview", () => {
    it("scopes by id", async () => {
      await repo.updateReview("review-1", { data: { rating: 5 } });
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: "review-1" },
        data: { rating: 5 },
      });
    });
  });

  describe("deleteReview", () => {
    it("deletes by id", async () => {
      await repo.deleteReview("review-1");
      expect(prisma.review.delete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
    });
  });

  describe("findById", () => {
    it("scopes by id", async () => {
      await repo.findById("review-1", { include: { user: true } });
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        include: { user: true },
        where: { id: "review-1" },
      });
    });
  });

  describe("findByOrderItemId", () => {
    it("scopes by order_item_id", async () => {
      await repo.findByOrderItemId("item-1", { include: { user: true } });
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        include: { user: true },
        where: { order_item_id: "item-1" },
      });
    });
  });

  describe("updateProductRatings", () => {
    it("increments rating_sum by difference", async () => {
      await repo.updateProductRatings("prod-1", 2);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { rating_sum: { increment: 2 } },
      });
    });
  });

  describe("findAllReviewsByProductId", () => {
    it("scopes by product_id", async () => {
      await repo.findAllReviewsByProductId("prod-1", { take: 10 });
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        take: 10,
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("getGroupedReviews", () => {
    it("groups by rating for a product", async () => {
      await repo.getGroupedReviews("prod-1");
      expect(prisma.review.groupBy).toHaveBeenCalledWith({
        by: ["rating"],
        where: { product_id: "prod-1" },
        _count: { rating: true },
        orderBy: { rating: "desc" },
      });
    });
  });

  describe("getReviewStats", () => {
    it("aggregates review stats for a product", async () => {
      await repo.getReviewStats("prod-1");
      expect(prisma.review.aggregate).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });
  });

  describe("findMany", () => {
    it("calls findMany directly", async () => {
      await repo.findMany({ take: 5 });
      expect(prisma.review.findMany).toHaveBeenCalledWith({ take: 5 });
    });
  });

  describe("findUnique", () => {
    it("calls findUnique directly", async () => {
      await repo.findUnique({ where: { id: "review-1" } });
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
    });
  });

  describe("count", () => {
    it("calls count directly", async () => {
      await repo.count({ where: { rating: 5 } });
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { rating: 5 },
      });
    });
  });

  describe("deleteReviewWithRatingUpdate", () => {
    it("deletes review and decrements product rating/count in transaction", async () => {
      await repo.deleteReviewWithRatingUpdate("review-1", "prod-1", 5);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.review.delete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          rating_sum: { decrement: 5 },
          review_count: { decrement: 1 },
        },
      });
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });
  });

  describe("aggregate", () => {
    it("calls aggregate directly", async () => {
      await repo.aggregate({ _max: { rating: true } });
      expect(prisma.review.aggregate).toHaveBeenCalledWith({
        _max: { rating: true },
      });
    });
  });

  describe("groupBy", () => {
    it("calls groupBy directly with orderBy undefined default", async () => {
      await repo.groupBy({ by: ["rating"] });
      expect(prisma.review.groupBy).toHaveBeenCalledWith({
        by: ["rating"],
        orderBy: undefined,
      });
    });
  });

  describe("scope hardening", () => {
    it("updateReview strips a caller where and forces the review id", async () => {
      await repo.updateReview("review-1", {
        where: { id: "other" },
        data: { rating: 1 },
      } as unknown as Parameters<typeof repo.updateReview>[1]);
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: "review-1" },
        data: { rating: 1 },
      });
    });

    it.each([
      ["findById", { id: "x" }],
      ["findByOrderItemId", { order_item_id: "x" }],
    ] as const)("%s queries with only its scope key", async (method, where) => {
      prisma.review.findUnique.mockResolvedValueOnce({ id: "review-1" });
      const result = await repo[method]("x");
      expect(prisma.review.findUnique).toHaveBeenCalledWith({ where });
      expect(result).toEqual({ id: "review-1" });
    });

    it("findAllReviewsByProductId queries by product only without options", async () => {
      await repo.findAllReviewsByProductId("prod-1");
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
      });
    });

    it("groupBy lets the caller supply orderBy", async () => {
      await repo.groupBy({
        by: ["rating"],
        orderBy: { rating: "asc" },
      } as Prisma.ReviewGroupByArgs);
      expect(prisma.review.groupBy).toHaveBeenCalledWith({
        by: ["rating"],
        orderBy: { rating: "asc" },
      });
    });
  });
});
