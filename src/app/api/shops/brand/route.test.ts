import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { brandServices, dbSearchService } from "@/di/container";

import { GET } from "./route";

const brands = vi.mocked(brandServices);
const search = vi.mocked(dbSearchService);
const result = {
  id: "b1",
  title: "Acme",
  image_key: "",
  subtitle: "brand",
  type: "brand",
};

describe("GET /api/shops/brand", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["", "?q=%20"])(
    "lists active brands without a query (%s)",
    async (query) => {
      brands.getActiveBrands.mockResolvedValue([
        { id: "b1", name: "Acme" },
      ] as never);

      expect(
        await expectSuccess(await GET(makeRequest(`/api/shops/brand${query}`)))
      ).toEqual([result]);
      expect(search.searchBrands).not.toHaveBeenCalled();
    }
  );

  it("searches brands with the trimmed query", async () => {
    search.searchBrands.mockResolvedValue({
      hits: [{ id: "b1", name: "Acme" }],
    } as never);

    expect(
      await expectSuccess(await GET(makeRequest("/api/shops/brand?q=%20ac%20")))
    ).toEqual([result]);
    expect(search.searchBrands).toHaveBeenCalledWith({
      query: "ac",
      limit: 10,
    });
  });

  it("returns 500 when lookup fails", async () => {
    brands.getActiveBrands.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/shops/brand")),
      500,
      "Failed to fetch brands"
    );
  });
});
