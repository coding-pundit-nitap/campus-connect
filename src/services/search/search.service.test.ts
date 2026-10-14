import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { searchAPIService } from "./search.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("searchAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["search", "search"],
    ["searchProducts", "search/product"],
  ] as const)("%s queries %s with q and signal", async (method, url) => {
    const signal = new AbortController().signal;
    axios.get.mockResolvedValue(envelope([{ id: "r1" }]));

    await expect(searchAPIService[method]("pen", signal)).resolves.toEqual([
      { id: "r1" },
    ]);
    expect(axios.get).toHaveBeenCalledWith(url, {
      params: { q: "pen" },
      signal,
    });
  });

  it("searchOrders serialises the date range and filters", async () => {
    const from = new Date("2030-01-01T00:00:00Z");
    const to = new Date("2030-01-02T00:00:00Z");
    axios.get.mockResolvedValue(envelope({ orders: [] }));

    await searchAPIService.searchOrders({
      query: "NITAP",
      status: "NEW",
      dateRange: { from, to },
      hostelBlock: "A",
      pageParam: "c1",
    });

    expect(axios.get).toHaveBeenCalledWith("search/orders", {
      params: {
        q: "NITAP",
        status: "NEW",
        from: from.toISOString(),
        to: to.toISOString(),
        cursor: "c1",
        hostel_block: "A",
      },
      signal: undefined,
    });
  });

  it("searchOrders leaves dates undefined without a range", async () => {
    axios.get.mockResolvedValue(envelope({ orders: [] }));

    await searchAPIService.searchOrders({ query: "", pageParam: undefined });

    const params = axios.get.mock.calls[0][1]?.params as Record<
      string,
      unknown
    >;
    expect(params.from).toBeUndefined();
    expect(params.to).toBeUndefined();
  });
});
