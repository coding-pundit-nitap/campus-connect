import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { reviewRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const reviews = vi.mocked(reviewRepository);
const get = () =>
  GET(
    makeRequest("/api/reviews/order-item/oi1"),
    routeParams({ order_item_id: "oi1" })
  );

describe("GET /api/reviews/order-item/[order_item_id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns the caller's review for the order item", async () => {
    reviews.findByOrderItemId.mockResolvedValue({
      id: "r1",
      user_id: "user-1",
    } as never);

    expect(await expectSuccess(await get())).toEqual({
      id: "r1",
      user_id: "user-1",
    });
    expect(reviews.findByOrderItemId).toHaveBeenCalledWith(
      "oi1",
      expect.objectContaining({ select: expect.any(Object) })
    );
  });

  it("returns 401 when the user id is empty", async () => {
    auth.getUserId.mockResolvedValue("");

    await expectError(await get(), 401, "Unauthorized");
  });

  it.each([
    ["missing", null],
    ["owned by someone else", { id: "r1", user_id: "other" }],
  ])("returns 404 when the review is %s", async (_label, review) => {
    reviews.findByOrderItemId.mockResolvedValue(review as never);

    await expectError(await get(), 404, "Review not found");
  });

  it("returns 500 when the lookup fails", async () => {
    reviews.findByOrderItemId.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "Failed to fetch review");
  });
});
