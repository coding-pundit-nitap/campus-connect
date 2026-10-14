import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { reviewRepository } from "@/di/container";

import { GET } from "./route";

const reviews = vi.mocked(reviewRepository);
const get = (query = "") =>
  GET(
    makeRequest(`/api/reviews/p1${query}`),
    routeParams({ product_id: "p1" })
  );

describe("GET /api/reviews/[product_id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviews.findAllReviewsByProductId.mockResolvedValue([] as never);
  });

  it("returns a page of reviews exposed as both data and reviews", async () => {
    reviews.findAllReviewsByProductId.mockResolvedValue([
      { id: "r1" },
    ] as never);

    expect(await expectSuccess(await get())).toEqual({
      data: [{ id: "r1" }],
      reviews: [{ id: "r1" }],
      nextCursor: null,
      hasMore: false,
    });
    expect(reviews.findAllReviewsByProductId).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ take: 21, skip: 0, cursor: undefined })
    );
  });

  it("continues after the cursor", async () => {
    await get("?cursor=r9&limit=3");

    expect(reviews.findAllReviewsByProductId).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ take: 4, skip: 1, cursor: { id: "r9" } })
    );
  });

  it("returns 400 for a non-numeric limit", async () => {
    await expectError(await get("?limit=x"), 400, "limit must be a number");
  });

  it("returns 500 when the repository fails", async () => {
    reviews.findAllReviewsByProductId.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "Failed to fetch reviews");
  });
});
