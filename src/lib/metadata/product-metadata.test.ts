import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({ env: {} as Record<string, unknown> }));

vi.mock("@/config/env.config", () => envMock);
vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { makeProduct } from "@tests/helpers/lib/builders";

import { productService } from "@/di/container";
import { Prisma } from "@/generated/client";

import {
  formatPriceForMetadata,
  generateProductJsonLd,
  generateProductMetadata,
  getProductImageUrl,
  getSiteUrl,
} from "./product-metadata";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const getProductById = vi.mocked(productService.getProductById);

type ProductDetail = Awaited<ReturnType<typeof productService.getProductById>>;
const productDetail = (
  overrides: Partial<NonNullable<ProductDetail>> = {}
): ProductDetail =>
  ({
    ...makeProduct({ description: null }),
    shop: { id: "shop-1", name: "Canteen" },
    category: { id: "cat-1", name: "Snacks" },
    ...overrides,
  }) as ProductDetail;

const jsonLdInput = (
  overrides: Partial<Parameters<typeof generateProductJsonLd>[0]> = {}
) => ({
  id: "product-1",
  name: "Masala Dosa",
  description: null,
  price: 100,
  image_key: "dosa.jpg",
  rating_sum: 0,
  review_count: 0,
  stock_quantity: 5,
  shop: { id: "shop-1", name: "Canteen" },
  ...overrides,
});

describe("product-metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.env.NEXT_PUBLIC_APP_URL = "https://campus.test";
    envMock.env.NEXT_PUBLIC_MINIO_BUCKET = "bucket";
  });

  describe("getSiteUrl / getProductImageUrl", () => {
    it("builds URLs from the configured app URL and bucket", () => {
      expect(getSiteUrl()).toBe("https://campus.test");
      expect(getProductImageUrl("a.jpg")).toBe(
        "https://campus.test/api/images/bucket/a.jpg"
      );
    });

    it("falls back to localhost and the products bucket", () => {
      envMock.env.NEXT_PUBLIC_APP_URL = "";
      envMock.env.NEXT_PUBLIC_MINIO_BUCKET = "";

      expect(getSiteUrl()).toBe("http://localhost:3000");
      expect(getProductImageUrl("a.jpg")).toBe(
        "http://localhost:3000/api/images/products/a.jpg"
      );
    });
  });

  describe("formatPriceForMetadata", () => {
    it.each<[string, string | null | undefined, string]>([
      ["100", undefined, "₹100.00"],
      ["100", null, "₹100.00"],
      ["100", "0", "₹100.00"],
      ["200", "25", "₹150.00 (25% off)"],
      ["80", "12.5", "₹70.00 (13% off)"],
    ])("formats price %s with discount %s as %s", (price, discount, out) => {
      expect(formatPriceForMetadata(price, discount)).toBe(out);
    });
  });

  describe("generateProductMetadata", () => {
    it("throws notFound when the product does not exist", async () => {
      getProductById.mockResolvedValue(null as ProductDetail);

      await expect(generateProductMetadata("missing")).rejects.toThrow(
        "NEXT_NOT_FOUND"
      );
    });

    it("builds an indexable, rated listing for an in-stock product", async () => {
      getProductById.mockResolvedValue(
        productDetail({
          description: "Fresh and crispy",
          rating_sum: 9,
          review_count: 2,
          discount: new Prisma.Decimal("20"),
        })
      );

      const meta = await generateProductMetadata("product-1");

      expect(getProductById).toHaveBeenCalledWith("product-1");
      expect(meta.title).toBe(
        "Masala Dosa - ₹80.00 (20% off) | Canteen | Campus Connect"
      );
      expect(meta.description).toBe("Fresh and crispy");
      expect(meta.category).toBe("Snacks");
      expect(meta.keywords).toContain("Snacks");
      expect(meta.alternates?.canonical).toBe(
        "https://campus.test/product/product-1"
      );
      expect(meta.robots).toMatchObject({ index: true });
      expect(meta.other).toMatchObject({
        "product:availability": "instock",
        "product:rating": "4.5",
        "product:rating:count": "2",
        "product:price:amount": "100",
      });
    });

    it("generates a description and marks out-of-stock products noindex", async () => {
      getProductById.mockResolvedValue(
        productDetail({ stock_quantity: 0, category: null })
      );

      const meta = await generateProductMetadata("product-1");

      expect(meta.description).toBe(
        "Buy Masala Dosa from Canteen at ₹100.00. Out of Stock."
      );
      expect(meta.category).toBe("Products");
      expect(meta.robots).toMatchObject({ index: false });
      expect(meta.other).toMatchObject({ "product:availability": "oos" });
      expect(meta.other).not.toHaveProperty("product:rating");
    });

    it("mentions stock in the generated description", async () => {
      getProductById.mockResolvedValue(productDetail());

      const meta = await generateProductMetadata("product-1");

      expect(meta.description).toContain("In Stock.");
    });

    it("truncates descriptions longer than 160 characters", async () => {
      getProductById.mockResolvedValue(
        productDetail({ description: "x".repeat(200) })
      );

      const meta = await generateProductMetadata("product-1");

      expect(meta.description).toBe(`${"x".repeat(157)}...`);
      expect(meta.openGraph?.description).toBe("x".repeat(200));
    });
  });

  describe("generateProductJsonLd", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("describes an in-stock product with numeric price and no extras", () => {
      const ld = generateProductJsonLd(jsonLdInput());

      expect(ld).toMatchObject({
        "@type": "Product",
        "@id": "https://campus.test/product/product-1",
        description: "Masala Dosa available at Canteen",
        image: ["https://campus.test/api/images/bucket/dosa.jpg"],
        offers: {
          price: "100.00",
          availability: "https://schema.org/InStock",
          priceValidUntil: new Date(
            NOW.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      });
      expect(ld).not.toHaveProperty("aggregateRating");
      expect(ld).not.toHaveProperty("category");
    });

    it("parses string prices and percentage discounts", () => {
      const ld = generateProductJsonLd(
        jsonLdInput({ price: "120.00", discount: "25" })
      );

      expect(ld.offers.price).toBe("90.00");
    });

    it("applies a numeric discount as a percentage", () => {
      const ld = generateProductJsonLd(
        jsonLdInput({ price: 200, discount: 30 })
      );

      expect(ld.offers.price).toBe("140.00");
    });

    it("adds rating, category and out-of-stock availability when present", () => {
      const ld = generateProductJsonLd(
        jsonLdInput({
          description: "Tasty",
          rating_sum: 7,
          review_count: 2,
          stock_quantity: 0,
          category: { id: "c", name: "Snacks" },
        })
      );

      expect(ld).toMatchObject({
        description: "Tasty",
        category: "Snacks",
        aggregateRating: { ratingValue: "3.5", reviewCount: 2 },
        offers: { availability: "https://schema.org/OutOfStock" },
      });
    });
  });
});
