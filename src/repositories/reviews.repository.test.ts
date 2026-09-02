import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import { BadRequestError } from "@/lib/custom-error";
import type { prisma } from "@/lib/prisma";
import { ReviewRepository } from "@/repositories/reviews.repository";

function buildFakePrismaClient() {
  const reviewFindUnique = vi.fn().mockResolvedValue({ id: "review-1" });
  const reviewFindMany = vi.fn().mockResolvedValue([{ id: "review-1" }]);
  const reviewCreate = vi.fn().mockResolvedValue({ id: "review-1" });
  const reviewUpdate = vi.fn().mockResolvedValue({ id: "review-1" });
  const reviewDelete = vi.fn().mockResolvedValue({ id: "review-1" });
  const reviewCount = vi.fn().mockResolvedValue(1);
  const reviewGroupBy = vi.fn().mockResolvedValue([]);
  const reviewAggregate = vi.fn().mockResolvedValue({ _avg: { rating: 4.5 } });

  const productUpdate = vi.fn().mockResolvedValue({ id: "prod-1" });

  const txReviewCreate = vi.fn().mockResolvedValue({ id: "review-1" });
  const txReviewDelete = vi.fn().mockResolvedValue({ id: "review-1" });
  const txProductUpdate = vi.fn().mockResolvedValue({ id: "prod-1" });

  type FakeTx = {
    review: { create: typeof txReviewCreate; delete: typeof txReviewDelete };
    product: { update: typeof txProductUpdate };
  };

  const tx: FakeTx = {
    review: { create: txReviewCreate, delete: txReviewDelete },
    product: { update: txProductUpdate },
  };

  const transaction = vi.fn(async (callback: (tx: FakeTx) => unknown) =>
    callback(tx)
  );

  const fakeClient = {
    review: {
      findUnique: reviewFindUnique,
      findMany: reviewFindMany,
      create: reviewCreate,
      update: reviewUpdate,
      delete: reviewDelete,
      count: reviewCount,
      groupBy: reviewGroupBy,
      aggregate: reviewAggregate,
    },
    product: {
      update: productUpdate,
    },
    $transaction: transaction,
  };

  return {
    fakeClient,
    reviewFindUnique,
    reviewFindMany,
    reviewCreate,
    reviewUpdate,
    reviewDelete,
    reviewCount,
    reviewGroupBy,
    reviewAggregate,
    productUpdate,
    transaction,
    txReviewCreate,
    txReviewDelete,
    txProductUpdate,
  };
}

describe("ReviewRepository", () => {
  let fakes: ReturnType<typeof buildFakePrismaClient>;
  let repo: ReviewRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    fakes = buildFakePrismaClient();
    repo = new ReviewRepository(fakes.fakeClient as unknown as typeof prisma);
  });

  describe("createReview", () => {
    it("throws BadRequestError if product_id is missing in data", async () => {
      const data = {
        rating: 5,
        product: { connect: {} },
      } as unknown as Prisma.ReviewCreateInput;
      await expect(repo.createReview(data)).rejects.toThrow(BadRequestError);
      expect(fakes.transaction).not.toHaveBeenCalled();
    });

    it("creates review and increments product rating/count in transaction", async () => {
      const data = {
        rating: 4,
        product: { connect: { id: "prod-1" } },
      } as unknown as Prisma.ReviewCreateInput;
      await repo.createReview(data, { include: { user: true } });

      expect(fakes.transaction).toHaveBeenCalledTimes(1);
      expect(fakes.txReviewCreate).toHaveBeenCalledWith({
        include: { user: true },
        data,
      });
      expect(fakes.txProductUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          rating_sum: { increment: 4 },
          review_count: { increment: 1 },
        },
      });
    });
  });

  describe("updateReview", () => {
    it("scopes by id", async () => {
      await repo.updateReview("review-1", { data: { rating: 5 } });
      expect(fakes.reviewUpdate).toHaveBeenCalledWith({
        where: { id: "review-1" },
        data: { rating: 5 },
      });
    });
  });

  describe("deleteReview", () => {
    it("deletes by id", async () => {
      await repo.deleteReview("review-1");
      expect(fakes.reviewDelete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
    });
  });

  describe("findById", () => {
    it("scopes by id", async () => {
      await repo.findById("review-1", { include: { user: true } });
      expect(fakes.reviewFindUnique).toHaveBeenCalledWith({
        include: { user: true },
        where: { id: "review-1" },
      });
    });
  });

  describe("findByOrderItemId", () => {
    it("scopes by order_item_id", async () => {
      await repo.findByOrderItemId("item-1", { include: { user: true } });
      expect(fakes.reviewFindUnique).toHaveBeenCalledWith({
        include: { user: true },
        where: { order_item_id: "item-1" },
      });
    });
  });

  describe("updateProductRatings", () => {
    it("increments rating_sum by difference", async () => {
      await repo.updateProductRatings("prod-1", 2);
      expect(fakes.productUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { rating_sum: { increment: 2 } },
      });
    });
  });

  describe("findAllReviewsByProductId", () => {
    it("scopes by product_id", async () => {
      await repo.findAllReviewsByProductId("prod-1", { take: 10 });
      expect(fakes.reviewFindMany).toHaveBeenCalledWith({
        take: 10,
        where: { product_id: "prod-1" },
      });
    });
  });

  describe("getGroupedReviews", () => {
    it("groups by rating for a product", async () => {
      await repo.getGroupedReviews("prod-1");
      expect(fakes.reviewGroupBy).toHaveBeenCalledWith({
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
      expect(fakes.reviewAggregate).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });
  });

  describe("findMany", () => {
    it("calls findMany directly", async () => {
      await repo.findMany({ take: 5 });
      expect(fakes.reviewFindMany).toHaveBeenCalledWith({ take: 5 });
    });
  });

  describe("findUnique", () => {
    it("calls findUnique directly", async () => {
      await repo.findUnique({ where: { id: "review-1" } });
      expect(fakes.reviewFindUnique).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
    });
  });

  describe("count", () => {
    it("calls count directly", async () => {
      await repo.count({ where: { rating: 5 } });
      expect(fakes.reviewCount).toHaveBeenCalledWith({ where: { rating: 5 } });
    });
  });

  describe("deleteReviewWithRatingUpdate", () => {
    it("deletes review and decrements product rating/count in transaction", async () => {
      await repo.deleteReviewWithRatingUpdate("review-1", "prod-1", 5);
      expect(fakes.transaction).toHaveBeenCalledTimes(1);
      expect(fakes.txReviewDelete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
      expect(fakes.txProductUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          rating_sum: { decrement: 5 },
          review_count: { decrement: 1 },
        },
      });
    });
  });

  describe("aggregate", () => {
    it("calls aggregate directly", async () => {
      await repo.aggregate({ _max: { rating: true } });
      expect(fakes.reviewAggregate).toHaveBeenCalledWith({
        _max: { rating: true },
      });
    });
  });

  describe("groupBy", () => {
    it("calls groupBy directly with orderBy undefined default", async () => {
      await repo.groupBy({ by: ["rating"] });
      expect(fakes.reviewGroupBy).toHaveBeenCalledWith({
        by: ["rating"],
        orderBy: undefined,
      });
    });
  });
});
