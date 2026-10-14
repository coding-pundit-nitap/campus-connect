import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { dbSearchService } from "@/di/container";

import { GET } from "./route";

const search = vi.mocked(dbSearchService);

describe("GET /api/search/product", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps product hits to search results", async () => {
    search.searchProducts.mockResolvedValue({
      hits: [
        {
          id: "p1",
          name: "Tea",
          shop_name: "Canteen",
          image_key: "k",
          shop_id: "s1",
        },
      ],
    } as never);

    expect(
      await expectSuccess(
        await GET(makeRequest("/api/search/product?q=%20tea%20"))
      )
    ).toEqual([
      {
        id: "p1",
        title: "Tea",
        subtitle: "Canteen",
        type: "product",
        image_key: "k",
        shop_id: "s1",
      },
    ]);
    expect(search.searchProducts).toHaveBeenCalledWith({
      query: "tea",
      limit: 10,
    });
  });

  it.each(["", "?q=", "?q=%20%20"])(
    "returns 400 without a query (%s)",
    async (query) => {
      await expectError(
        await GET(makeRequest(`/api/search/product${query}`)),
        400,
        "Search query is required"
      );
    }
  );

  it("returns 500 when search fails", async () => {
    search.searchProducts.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/search/product?q=tea")),
      500,
      "An internal server error occurred during search."
    );
  });
});
