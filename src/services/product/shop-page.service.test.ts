import { beforeEach, describe, expect, it, vi } from "vitest";

import { productService } from "@/di/container";
import { getProductStates } from "@/lib/utils";

import { getShopPageData } from "./shop-page.service";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils", () => ({ getProductStates: vi.fn(() => ({ p1: {} })) }));

describe("getShopPageData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads shop products and derives their UI state", async () => {
    const initialProducts = [{ id: "p1" }];
    vi.mocked(productService.fetchShopProducts).mockResolvedValue({
      initialProducts,
      hasNextPage: false,
      nextCursor: null,
      error: "partial",
    } as never);

    const result = await getShopPageData("shop-1");

    expect(productService.fetchShopProducts).toHaveBeenCalledWith("shop-1");
    expect(getProductStates).toHaveBeenCalledWith(
      initialProducts,
      initialProducts,
      false,
      false
    );
    expect(result).toEqual({
      initialProducts,
      productStates: { p1: {} },
      hasNextPage: false,
      nextCursor: null,
      error: "partial",
    });
  });
});
