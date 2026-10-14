import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { reviewApiService } from "./review-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("reviewApiService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["c1", "c1"],
    [null, undefined],
  ])("fetchReviews with cursor %s", async (cursor, sent) => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await reviewApiService.fetchReviews({ product_id: "p1", cursor });

    expect(axios.get).toHaveBeenCalledWith("reviews/p1", {
      params: { limit: 5, cursor: sent },
    });
  });

  it("fetchReviewByOrderItemId returns the review or null", async () => {
    axios.get.mockResolvedValue(envelope(null));

    await expect(
      reviewApiService.fetchReviewByOrderItemId("oi1")
    ).resolves.toBeNull();
    expect(axios.get).toHaveBeenCalledWith("reviews/order-item/oi1", undefined);
  });
});
