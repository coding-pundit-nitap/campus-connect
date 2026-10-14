import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { productAPIService } from "./product-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("productAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchShopProducts forwards filters with a fixed page size", async () => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await productAPIService.fetchShopProducts({
      shop_id: "s1",
      cursor: null,
      sortBy: "price",
      sortOrder: "asc",
      categoryId: "cat",
      search: "pen",
      inStock: true,
    });

    expect(axios.get).toHaveBeenCalledWith("shops/s1/products", {
      params: {
        limit: 20,
        cursor: undefined,
        sortBy: "price",
        sortOrder: "asc",
        categoryId: "cat",
        search: "pen",
        inStock: true,
      },
    });
  });

  it("fetchShopProducts keeps a provided cursor", async () => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await productAPIService.fetchShopProducts({ shop_id: "s1", cursor: "c9" });

    expect(axios.get.mock.calls[0][1]).toMatchObject({
      params: { cursor: "c9" },
    });
  });

  it("fetchProducts uses defaults and drops empty filters", async () => {
    axios.get.mockResolvedValue(envelope({ initialProducts: [] }));

    await productAPIService.fetchProducts({});

    expect(axios.get).toHaveBeenCalledWith("products", {
      params: {
        limit: 10,
        cursor: undefined,
        categoryId: undefined,
        hasDiscount: undefined,
      },
    });
  });

  it("fetchProducts forwards provided filters", async () => {
    axios.get.mockResolvedValue(envelope({ initialProducts: [] }));

    await productAPIService.fetchProducts({
      limit: 3,
      cursor: "c1",
      categoryId: "cat",
      hasDiscount: true,
    });

    expect(axios.get).toHaveBeenCalledWith("products", {
      params: { limit: 3, cursor: "c1", categoryId: "cat", hasDiscount: true },
    });
  });

  it("fetchStockWatches unwraps the watch list", async () => {
    axios.get.mockResolvedValue(envelope([{ id: "w1" }]));

    await expect(productAPIService.fetchStockWatches()).resolves.toEqual([
      { id: "w1" },
    ]);
    expect(axios.get).toHaveBeenCalledWith("products/stock-watch", undefined);
  });

  it("checkIsWatchingStock sends product_id", async () => {
    axios.get.mockResolvedValue(envelope(false));

    await expect(
      productAPIService.checkIsWatchingStock({ product_id: "p1" })
    ).resolves.toBe(false);
    expect(axios.get).toHaveBeenCalledWith("products/stock-watch", {
      params: { product_id: "p1" },
    });
  });
});
