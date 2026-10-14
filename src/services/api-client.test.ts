import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { apiGet, apiPost } from "./api-client";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

import { envelope } from "@tests/helpers/services";
const axios = vi.mocked(axiosInstance);

describe("api-client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("apiGet forwards url and config and unwraps the envelope", async () => {
    axios.get.mockResolvedValue(envelope({ id: 1 }));

    const result = await apiGet("things", { params: { a: 1 } });

    expect(result).toEqual({ id: 1 });
    expect(axios.get).toHaveBeenCalledWith("things", { params: { a: 1 } });
  });

  it("apiPost forwards body and config and unwraps the envelope", async () => {
    axios.post.mockResolvedValue(envelope("created"));

    const result = await apiPost("things", { name: "x" }, { timeout: 1 });

    expect(result).toBe("created");
    expect(axios.post).toHaveBeenCalledWith(
      "things",
      { name: "x" },
      { timeout: 1 }
    );
  });

  it("propagates request errors", async () => {
    axios.get.mockRejectedValue(new Error("network"));

    await expect(apiGet("things")).rejects.toThrow("network");
  });
});
