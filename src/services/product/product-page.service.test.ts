import { beforeEach, describe, expect, it, vi } from "vitest";

import { productService, reviewRepository } from "@/di/container";
import { serializeProduct } from "@/lib/utils/product.utils";

import { getProductPageData } from "./product-page.service";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/product.utils", () => ({
  serializeProduct: vi.fn(),
}));

const product = { id: "p1", shop: { id: "s1", name: "Store" } };
const serialized = {
  id: "p1",
  name: "Pen",
  image_key: "pen.png",
  stock_quantity: 4,
  rating: 4.5,
  price: 10,
  discount: 0,
  description: "Blue",
};
const reviews = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}` }));

describe("getProductPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.getProductById).mockResolvedValue(
      product as never
    );
    vi.mocked(serializeProduct).mockReturnValue(serialized as never);
    vi.mocked(reviewRepository.getGroupedReviews).mockResolvedValue([
      { rating: 5, _count: { rating: 3 } },
      { rating: 2, _count: { rating: 1 } },
      null,
    ] as never);
    vi.mocked(reviewRepository.findAllReviewsByProductId).mockResolvedValue(
      reviews(2) as never
    );
  });

  it("throws notFound for an unknown product", async () => {
    vi.mocked(productService.getProductById).mockResolvedValue(null as never);

    await expect(getProductPageData("p1")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("builds the product view with a rating histogram", async () => {
    const result = await getProductPageData("p1");

    expect(result.reviewGroup).toEqual({
      one: 0,
      two: 1,
      three: 0,
      four: 0,
      five: 3,
    });
    expect(result.product).toEqual({
      id: "p1",
      name: "Pen",
      image_key: "pen.png",
      shop: { id: "s1", name: "Store" },
      stock_quantity: 4,
      rating: 4.5,
      review_count: 4,
      price: 10,
      discount: 0,
      description: "Blue",
    });
    expect(result).toMatchObject({
      initialReviews: reviews(2),
      hasNextPage: false,
      nextCursor: null,
      rawProductId: "p1",
    });
    expect(reviewRepository.findAllReviewsByProductId).toHaveBeenCalledWith(
      "p1",
      {
        take: 11,
        include: { user: { select: { name: true, image: true } } },
        orderBy: { created_at: "desc" },
      }
    );
  });

  it("paginates from the last returned review when more than 10 come back", async () => {
    vi.mocked(reviewRepository.findAllReviewsByProductId).mockResolvedValue(
      reviews(11) as never
    );

    const result = await getProductPageData("p1");

    expect(result.initialReviews).toHaveLength(10);
    expect(result).toMatchObject({ hasNextPage: true, nextCursor: "r9" });
  });

  it("handles missing grouped reviews and description", async () => {
    vi.mocked(reviewRepository.getGroupedReviews).mockResolvedValue(
      null as never
    );
    vi.mocked(serializeProduct).mockReturnValue({
      ...serialized,
      description: null,
    } as never);

    const result = await getProductPageData("p1");

    expect(result.product).toMatchObject({ review_count: 0, description: "" });
  });
});
