import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { dbSearchService } from "@/di/container";

import { GET } from "./route";

const search = vi.mocked(dbSearchService);
const get = (query = "") => GET(makeRequest(`/api/search/products${query}`));

describe("GET /api/search/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.searchProducts.mockResolvedValue({ hits: [] } as never);
  });

  it("searches with defaults when no params are given", async () => {
    expect(await expectSuccess(await get())).toEqual({ hits: [] });
    expect(search.searchProducts).toHaveBeenCalledWith({
      query: undefined,
      shop_type: undefined,
      is_veg: undefined,
      brand_id: undefined,
      limit: 24,
    });
  });

  it("applies the veg filter only for canteens", async () => {
    await get("?q=%20dosa%20&type=CANTEEN&veg=true&brand_id=b1&limit=5");

    expect(search.searchProducts).toHaveBeenCalledWith({
      query: "dosa",
      shop_type: "CANTEEN",
      is_veg: true,
      brand_id: undefined,
      limit: 5,
    });
  });

  it("applies the brand filter only for stationery", async () => {
    await get("?type=STATIONERY&veg=true&brand_id=b1");

    expect(search.searchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ is_veg: undefined, brand_id: "b1" })
    );
  });

  it("returns 500 when search fails", async () => {
    search.searchProducts.mockRejectedValue(new Error("db"));

    await expectError(
      await get(),
      500,
      "An internal server error occurred during product search."
    );
  });
});
