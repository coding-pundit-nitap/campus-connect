import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { vendorApiService } from "./vendor-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("vendorApiService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [
      "getBatchSlots",
      () => vendorApiService.getBatchSlots("s1"),
      "/shops/s1/batch-slots",
    ],
    [
      "getNextSlot",
      () => vendorApiService.getNextSlot("s1"),
      "/shops/s1/next-slot",
    ],
    [
      "getActiveBatchData",
      () => vendorApiService.getActiveBatchData(),
      "/vendor/batch/active",
    ],
    [
      "getDirectDeliveriesData",
      () => vendorApiService.getDirectDeliveriesData(),
      "/vendor/batch/direct-deliveries",
    ],
    [
      "getDeliveryRunData",
      () => vendorApiService.getDeliveryRunData(),
      "/vendor/batch/delivery-run",
    ],
    [
      "getOrderConsoleData",
      () => vendorApiService.getOrderConsoleData(),
      "/vendor/orders/console",
    ],
    [
      "getVendorEarnings",
      () => vendorApiService.getVendorEarnings("this week"),
      "/vendor/earnings?period=this%20week",
    ],
  ])("%s GETs %s and unwraps data", async (_name, call, url) => {
    axios.get.mockResolvedValue(envelope({ ok: 1 }));

    await expect(call()).resolves.toEqual({ ok: 1 });
    expect(axios.get).toHaveBeenCalledWith(url, undefined);
  });

  it("getVendorOrderHistory serialises only set params", async () => {
    axios.get.mockResolvedValue(envelope({ orders: [] }));

    await vendorApiService.getVendorOrderHistory({
      page: 2,
      pageSize: 20,
      search: "",
      status: "NEW",
      paymentStatus: undefined,
    });

    expect(axios.get).toHaveBeenCalledWith(
      "/vendor/orders/history?page=2&pageSize=20&status=NEW",
      undefined
    );
  });
});
