import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { cartAPIService } from "./cart-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("cartAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchCartForShop requests the shop cart", async () => {
    axios.get.mockResolvedValue(envelope({ id: "c1" }));

    await expect(cartAPIService.fetchCartForShop("s1")).resolves.toEqual({
      id: "c1",
    });
    expect(axios.get).toHaveBeenCalledWith("cart?shop_id=s1", {
      params: { shop_id: "s1" },
    });
  });

  it("fetchAllUserCarts requests cart/all", async () => {
    axios.get.mockResolvedValue(envelope([]));

    await expect(cartAPIService.fetchAllUserCarts()).resolves.toEqual([]);
    expect(axios.get).toHaveBeenCalledWith("cart/all", undefined);
  });
});
