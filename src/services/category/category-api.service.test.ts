import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { categoryAPIService } from "./category-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("categoryAPIService.search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries shops/category with q", async () => {
    axios.get.mockResolvedValue(envelope([]));

    await expect(categoryAPIService.search("ink")).resolves.toEqual([]);
    expect(axios.get).toHaveBeenCalledWith("shops/category", {
      params: { q: "ink" },
    });
  });
});
