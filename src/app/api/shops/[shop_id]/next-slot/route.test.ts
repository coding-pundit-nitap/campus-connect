import { makeRequest, readJson, routeParams } from "@tests/helpers";
import { expectSuccess } from "@tests/helpers/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { batchService } from "@/di/container";

import { GET } from "./route";

const service = vi.mocked(batchService);
const NOW = new Date("2026-01-01T10:00:00Z");
const get = () =>
  GET(makeRequest("/api/shops/s1/next-slot"), routeParams({ shop_id: "s1" }));

describe("GET /api/shops/[shop_id]/next-slot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("reports batching disabled", async () => {
    service.getNextSlot.mockResolvedValue({ enabled: false } as never);

    expect(await expectSuccess(await get())).toEqual({
      enabled: false,
      cutoff_time: null,
      batch_id: null,
      minutes_remaining: null,
      is_open: false,
    });
    expect(service.getNextSlot).toHaveBeenCalledWith("s1");
  });

  it("rounds minutes remaining up", async () => {
    service.getNextSlot.mockResolvedValue({
      enabled: true,
      cutoff_time: new Date(NOW.getTime() + 90_000),
      batch_id: "b1",
      is_open: true,
    } as never);

    expect(await expectSuccess(await get())).toEqual({
      enabled: true,
      cutoff_time: "2026-01-01T10:01:30.000Z",
      batch_id: "b1",
      minutes_remaining: 2,
      is_open: true,
    });
  });

  it("never reports negative minutes for a past cutoff", async () => {
    service.getNextSlot.mockResolvedValue({
      enabled: true,
      cutoff_time: new Date(NOW.getTime() - 60_000),
      batch_id: null,
      is_open: false,
    } as never);

    expect(await expectSuccess(await get())).toMatchObject({
      minutes_remaining: 0,
    });
  });

  it.each([
    [new Error("db down"), "db down"],
    ["boom", "Failed to get next slot"],
  ])("returns 500 with an error body (%s)", async (error, message) => {
    service.getNextSlot.mockRejectedValue(error);

    expect(await readJson(await get())).toEqual({
      status: 500,
      body: { error: message },
    });
  });
});
