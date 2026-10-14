import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { productService } from "@/di/container";
import { UnauthenticatedError } from "@/lib/custom-error";

import { GET } from "./route";

const products = vi.mocked(productService);

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    products.getPaginatedProducts.mockResolvedValue({ data: [] } as never);
  });

  it("passes parsed query params to the service", async () => {
    const data = await expectSuccess(
      await GET(
        makeRequest(
          "/api/products?limit=5&cursor=cjld2cjxh0000qzrmn831i7rn&categoryId=cat&hasDiscount=true"
        )
      )
    );

    expect(data).toEqual({ data: [] });
    expect(products.getPaginatedProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
        cursor: "cjld2cjxh0000qzrmn831i7rn",
        categoryId: "cat",
        hasDiscount: true,
      })
    );
  });

  it("accepts hasDiscount=1 as true", async () => {
    await GET(makeRequest("/api/products?hasDiscount=1"));

    expect(products.getPaginatedProducts).toHaveBeenCalledWith(
      expect.objectContaining({ hasDiscount: true })
    );
  });

  it("returns 400 for invalid query params", async () => {
    await expectError(
      await GET(makeRequest("/api/products?limit=-1")),
      400,
      "Invalid query parameters"
    );
  });

  it("returns 401 when the service reports an unauthenticated caller", async () => {
    products.getPaginatedProducts.mockRejectedValue(
      new UnauthenticatedError("Sign in")
    );

    await expectError(await GET(makeRequest("/api/products")), 401, "Sign in");
  });

  it("returns 500 on unexpected errors", async () => {
    products.getPaginatedProducts.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/products")),
      500,
      "Failed to fetch products"
    );
  });
});
