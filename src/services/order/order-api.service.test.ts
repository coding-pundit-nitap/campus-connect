import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { orderAPIService } from "./order-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("orderAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchUserOrders maps filters to query params", async () => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await orderAPIService.fetchUserOrders({
      limit: 5,
      cursor: "c1",
      status: "NEW",
      dateFrom: "2030-01-01",
      dateTo: "2030-01-31",
    });

    expect(axios.get).toHaveBeenCalledWith("orders", {
      params: {
        limit: 5,
        cursor: "c1",
        status: "NEW",
        date_from: "2030-01-01",
        date_to: "2030-01-31",
      },
    });
  });

  it("fetchUserOrders defaults limit and drops empty filters", async () => {
    axios.get.mockResolvedValue(envelope({ data: [], nextCursor: null }));

    await orderAPIService.fetchUserOrders({ cursor: null, dateFrom: "" });

    expect(axios.get).toHaveBeenCalledWith("orders", {
      params: {
        limit: 10,
        cursor: undefined,
        status: undefined,
        date_from: undefined,
        date_to: undefined,
      },
    });
  });

  it("dounloadInvoice requests the PDF as a blob", async () => {
    const blob = new Blob(["pdf"]);
    axios.get.mockResolvedValue({ data: blob });

    await expect(orderAPIService.dounloadInvoice("o1")).resolves.toBe(blob);
    expect(axios.get).toHaveBeenCalledWith("orders/o1/pdf", {
      responseType: "blob",
    });
  });

  it("fetchOrderById unwraps the order", async () => {
    axios.get.mockResolvedValue(envelope({ id: "o1" }));

    await expect(orderAPIService.fetchOrderById("o1")).resolves.toEqual({
      id: "o1",
    });
    expect(axios.get).toHaveBeenCalledWith("orders/o1", undefined);
  });
});
