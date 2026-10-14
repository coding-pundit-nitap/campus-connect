import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { userAPIService } from "./user-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("userAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMe returns the raw user body", async () => {
    axios.get.mockResolvedValue({ data: { id: "u1" } });

    await expect(userAPIService.getMe()).resolves.toEqual({ id: "u1" });
    expect(axios.get).toHaveBeenCalledWith("/user/me");
  });

  it("updateMe PUTs the payload", async () => {
    axios.put.mockResolvedValue({ data: { id: "u1", name: "Ada" } });

    await expect(userAPIService.updateMe({ name: "Ada" })).resolves.toEqual({
      id: "u1",
      name: "Ada",
    });
    expect(axios.put).toHaveBeenCalledWith("/user/me", { name: "Ada" });
  });

  it("fetchUserAddresses returns the full envelope", async () => {
    const body = envelope([{ id: "a1" }]).data;
    axios.get.mockResolvedValue({ data: body });

    await expect(userAPIService.fetchUserAddresses()).resolves.toBe(body);
    expect(axios.get).toHaveBeenCalledWith("users/addresses");
  });
});
