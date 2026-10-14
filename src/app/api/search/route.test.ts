import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { dbSearchService } from "@/di/container";

import { GET } from "./route";

const search = vi.mocked(dbSearchService);

describe("GET /api/search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs a global search with the trimmed query", async () => {
    search.globalSearch.mockResolvedValue([{ id: "x" }] as never);

    expect(
      await expectSuccess(await GET(makeRequest("/api/search?q=%20pen%20")))
    ).toEqual([{ id: "x" }]);
    expect(search.globalSearch).toHaveBeenCalledWith("pen");
  });

  it.each(["", "?q=%20"])("returns 400 without a query (%s)", async (query) => {
    await expectError(
      await GET(makeRequest(`/api/search${query}`)),
      400,
      "Search query is required"
    );
  });

  it("returns 500 when search fails", async () => {
    search.globalSearch.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/search?q=pen")),
      500,
      "An internal server error occurred during search."
    );
  });
});
