import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { buildingApiService } from "./building-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("buildingApiService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["getBuildings", () => buildingApiService.getBuildings(), "/buildings"],
    [
      "getShopDeliveryBuildings",
      () => buildingApiService.getShopDeliveryBuildings(),
      "/vendor/delivery-buildings",
    ],
    [
      "getPublicShopDeliveryBuildings",
      () => buildingApiService.getPublicShopDeliveryBuildings("s1"),
      "/shops/s1/delivery-buildings",
    ],
  ])("%s GETs %s and unwraps data", async (_name, call, url) => {
    axios.get.mockResolvedValue(envelope([{ id: "b1" }]));

    await expect(call()).resolves.toEqual([{ id: "b1" }]);
    expect(axios.get).toHaveBeenCalledWith(url, undefined);
  });
});
