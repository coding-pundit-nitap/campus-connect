import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { announcementAPIService } from "./announcement-api.service";

vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);

describe("announcementAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [undefined, {}],
    ["ALL" as const, {}],
    ["CANTEEN" as const, { type: "CANTEEN" }],
  ])("fetchAnnouncements(%s) sends params %j", async (type, params) => {
    axios.get.mockResolvedValue(envelope([{ id: "a1" }]));

    const result = await announcementAPIService.fetchAnnouncements(type);

    expect(result).toEqual([{ id: "a1" }]);
    expect(axios.get).toHaveBeenCalledWith("announcements", { params });
  });

  it("fetchShopAnnouncements unwraps the vendor list", async () => {
    axios.get.mockResolvedValue(envelope([{ id: "a2" }]));

    await expect(
      announcementAPIService.fetchShopAnnouncements()
    ).resolves.toEqual([{ id: "a2" }]);
    expect(axios.get).toHaveBeenCalledWith("vendor/announcements", undefined);
  });
});
