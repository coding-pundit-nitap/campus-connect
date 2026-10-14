import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { categoryServices, dbSearchService } from "@/di/container";

import { GET } from "./route";

const categories = vi.mocked(categoryServices);
const search = vi.mocked(dbSearchService);
const result = {
  id: "c1",
  title: "Snacks",
  image_key: "",
  subtitle: "category",
  type: "category",
};

describe("GET /api/shops/category", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["", "?q=%20"])(
    "lists active categories without a query (%s)",
    async (query) => {
      categories.getActiveCategories.mockResolvedValue([
        { id: "c1", name: "Snacks" },
      ] as never);

      expect(
        await expectSuccess(
          await GET(makeRequest(`/api/shops/category${query}`))
        )
      ).toEqual([result]);
      expect(search.searchCategories).not.toHaveBeenCalled();
    }
  );

  it("searches categories with the trimmed query", async () => {
    search.searchCategories.mockResolvedValue({
      hits: [{ id: "c1", name: "Snacks" }],
    } as never);

    expect(
      await expectSuccess(
        await GET(makeRequest("/api/shops/category?q=%20sn%20"))
      )
    ).toEqual([result]);
    expect(search.searchCategories).toHaveBeenCalledWith({
      query: "sn",
      limit: 10,
    });
  });

  it("returns 500 when lookup fails", async () => {
    search.searchCategories.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/shops/category?q=x")),
      500,
      "Failed to fetch categories"
    );
  });
});
