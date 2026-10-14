import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { shopAPIService } from "./shop-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("shopAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [
      "fetchShop",
      () => shopAPIService.fetchShop({ shop_id: "s1" }),
      "shops/s1",
    ],
    ["fetchShopsByUser", () => shopAPIService.fetchShopsByUser(), "shops"],
    [
      "fetchFavoriteShops",
      () => shopAPIService.fetchFavoriteShops(),
      "shops/favorites",
    ],
  ])("%s GETs %s", async (_name, call, url) => {
    axios.get.mockResolvedValue(envelope({ ok: true }));

    await expect(call()).resolves.toEqual({ ok: true });
    expect(axios.get).toHaveBeenCalledWith(url, undefined);
  });

  it.each([
    ["c1", "c1"],
    [null, undefined],
  ])("fetchShops with cursor %s", async (cursor, sent) => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await shopAPIService.fetchShops({ cursor });

    expect(axios.get).toHaveBeenCalledWith("shops/all", {
      params: { limit: 10, cursor: sent },
    });
  });

  it("checkIsFavoriteShop sends shop_id", async () => {
    axios.get.mockResolvedValue(envelope(true));

    await expect(
      shopAPIService.checkIsFavoriteShop({ shop_id: "s1" })
    ).resolves.toBe(true);
    expect(axios.get).toHaveBeenCalledWith("shops/favorites", {
      params: { shop_id: "s1" },
    });
  });
});
