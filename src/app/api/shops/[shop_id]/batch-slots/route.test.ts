import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { batchService } from "@/di/container";

import { GET } from "./route";

const service = vi.mocked(batchService);
const get = () =>
  GET(makeRequest("/api/shops/s1/batch-slots"), routeParams({ shop_id: "s1" }));

describe("GET /api/shops/[shop_id]/batch-slots", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the shop's slots with availability", async () => {
    service.getBatchSlotsWithAvailability.mockResolvedValue([
      { id: "slot" },
    ] as never);

    expect(await expectSuccess(await get())).toEqual([{ id: "slot" }]);
    expect(service.getBatchSlotsWithAvailability).toHaveBeenCalledWith("s1");
  });

  it("returns 500 when the service fails", async () => {
    service.getBatchSlotsWithAvailability.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "Failed to fetch batch slots");
  });
});
