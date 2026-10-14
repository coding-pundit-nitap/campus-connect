import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils", () => ({
  serializeProduct: vi.fn((p: { id: string }) => ({ id: p.id })),
}));

import { productService } from "@/di/container";

import { GET } from "./route";

const products = vi.mocked(productService);
const get = () =>
  GET(makeRequest("/api/products/p1"), routeParams({ product_id: "p1" }));

describe("GET /api/products/[product_id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the serialized product with its shop", async () => {
    products.getProductById.mockResolvedValue({
      id: "p1",
      shop: { id: "s1", name: "Shop", extra: true },
    } as never);

    expect(await expectSuccess(await get())).toEqual({
      id: "p1",
      shop: { name: "Shop", id: "s1" },
    });
    expect(products.getProductById).toHaveBeenCalledWith("p1");
  });

  it("returns 404 when the product does not exist", async () => {
    products.getProductById.mockResolvedValue(null as never);

    await expectError(await get(), 404, "Product not found");
  });

  it("returns 500 when the service fails", async () => {
    products.getProductById.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "An internal server error occurred.");
  });
});
