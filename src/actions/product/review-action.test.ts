import { beforeEach, describe, expect, it, vi } from "vitest";

import { reviewService } from "@/di/container";
import { ForbiddenError, InternalServerError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { createReviewAction, updateReviewAction } from "./review-action";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

const auth = vi.mocked(authUtils);
const service = vi.mocked(reviewService);
const review = { id: "r1", rating: 5 };

describe("review-action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  describe("updateReviewAction", () => {
    const input = {
      review_id: "r1",
      product_id: "p1",
      rating: 4,
      comment: "ok",
    };

    it("updates the user's review", async () => {
      service.updateReview.mockResolvedValue(review as never);

      const res = await updateReviewAction(input);

      expect(service.updateReview).toHaveBeenCalledWith(
        "user-1",
        { rating: 4, comment: "ok" },
        "p1",
        "r1"
      );
      expect(res).toMatchObject({ success: true, data: review });
    });

    it("signals Next's unauthorized() instead of a 500 without a user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(updateReviewAction(input)).rejects.toThrow(
        "NEXT_UNAUTHORIZED"
      );
      expect(service.updateReview).not.toHaveBeenCalled();
    });

    it("wraps service errors, including ForbiddenError", async () => {
      service.updateReview.mockRejectedValue(new ForbiddenError());

      await expect(updateReviewAction(input)).rejects.toThrow(
        new InternalServerError("Failed to update review")
      );
    });
  });

  describe("createReviewAction", () => {
    const input = {
      product_id: "p1",
      order_item_id: "oi1",
      rating: 5,
      comment: "great",
    };

    it("creates a review for the purchased item", async () => {
      service.createReview.mockResolvedValue(review as never);

      const res = await createReviewAction(input);

      expect(service.createReview).toHaveBeenCalledWith(
        { rating: 5, comment: "great" },
        "p1",
        "oi1",
        "user-1"
      );
      expect(res).toMatchObject({ success: true, data: review });
    });

    it("rethrows ForbiddenError", async () => {
      service.createReview.mockRejectedValue(new ForbiddenError("not bought"));

      await expect(createReviewAction(input)).rejects.toThrow(
        new ForbiddenError("not bought")
      );
    });

    it("signals Next's unauthorized() instead of a 500 without a user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(createReviewAction(input)).rejects.toThrow(
        "NEXT_UNAUTHORIZED"
      );
      expect(service.createReview).not.toHaveBeenCalled();
    });

    it("wraps unexpected errors", async () => {
      service.createReview.mockRejectedValue(new Error("db"));

      await expect(createReviewAction(input)).rejects.toThrow(
        new InternalServerError("Failed to create review")
      );
    });
  });
});
