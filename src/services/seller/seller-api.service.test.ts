import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { sellerAPIService } from "./seller-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("sellerAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchSellerOrders unwraps seller orders", async () => {
    axios.get.mockResolvedValue(envelope([{ id: "o1" }]));

    await expect(sellerAPIService.fetchSellerOrders()).resolves.toEqual([
      { id: "o1" },
    ]);
    expect(axios.get).toHaveBeenCalledWith("seller/orders", undefined);
  });
});
