import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { brandAPIService } from "./brand-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("brandAPIService.search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries with q and returns results", async () => {
    axios.get.mockResolvedValue(envelope([{ id: "r1" }]));

    await expect(brandAPIService.search("pen")).resolves.toEqual([
      { id: "r1" },
    ]);
    expect(axios.get).toHaveBeenCalledWith("shops/brand", {
      params: { q: "pen" },
    });
  });
});
