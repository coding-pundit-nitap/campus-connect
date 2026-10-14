import { beforeEach, describe, expect, it, vi } from "vitest";

import { productService } from "@/di/container";

import { getHomepageData } from "./homepage.service";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

describe("getHomepageData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the first page of products", async () => {
    vi.mocked(productService.getPaginatedProducts).mockResolvedValue({
      initialProducts: [{ id: "p1" }],
      hasNextPage: true,
      nextCursor: "c1",
      error: undefined,
    } as never);

    await expect(getHomepageData()).resolves.toEqual({
      initialProducts: [{ id: "p1" }],
      hasNextPage: true,
      nextCursor: "c1",
      initialError: undefined,
    });
    expect(productService.getPaginatedProducts).toHaveBeenCalledWith({
      limit: 20,
    });
  });

  it("returns an empty page when loading fails", async () => {
    vi.mocked(productService.getPaginatedProducts).mockRejectedValue(
      new Error("db")
    );

    await expect(getHomepageData()).resolves.toEqual({
      initialProducts: [],
      hasNextPage: false,
      nextCursor: null,
      initialError: undefined,
    });
  });
});
