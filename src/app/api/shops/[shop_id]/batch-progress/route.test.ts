import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);

import { batchRepository, shopRepository } from "@/di/container";

import { GET } from "./route";

const shops = vi.mocked(shopRepository);
const batches = vi.mocked(batchRepository);
const get = () =>
  GET(
    makeRequest("/api/shops/s1/batch-progress"),
    routeParams({ shop_id: "s1" })
  );

const openBatch = (overrides: Record<string, unknown> = {}) => ({
  id: "b1",
  status: "OPEN",
  collective_total: "150",
  min_order_value_snapshot: "200",
  cutoff_time: new Date("2026-01-01T10:00:00Z"),
  ...overrides,
});

describe("GET /api/shops/[shop_id]/batch-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shops.findById.mockResolvedValue({ batch_min_order_value: "100" } as never);
  });

  it("uses the batch's snapshot minimum when present", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue(openBatch() as never);

    expect(await expectSuccess(await get())).toEqual({
      batchId: "b1",
      status: "OPEN",
      collectiveTotal: 150,
      minRequired: 200,
      isMet: false,
      cutoffTime: "2026-01-01T10:00:00.000Z",
    });
  });

  it("falls back to the shop minimum when the batch has no snapshot", async () => {
    batches.findOpenBatchByShopId.mockResolvedValue(
      openBatch({ min_order_value_snapshot: null, cutoff_time: null }) as never
    );

    expect(await expectSuccess(await get())).toMatchObject({
      minRequired: 100,
      isMet: true,
      cutoffTime: null,
    });
  });

  it("reports an empty, met batch when there is no open batch or minimum", async () => {
    shops.findById.mockResolvedValue({ batch_min_order_value: null } as never);
    batches.findOpenBatchByShopId.mockResolvedValue(null as never);

    expect(await expectSuccess(await get())).toEqual({
      batchId: null,
      status: null,
      collectiveTotal: 0,
      minRequired: null,
      isMet: true,
      cutoffTime: null,
    });
  });

  it("returns 404 when the shop does not exist", async () => {
    shops.findById.mockResolvedValue(null as never);

    await expectError(await get(), 404, "Shop not found");
  });

  it.each([[new Error("db down: host=10.0.0.5")], ["boom"]])(
    "returns a generic 500 without leaking the cause (%s)",
    async (error) => {
      batches.findOpenBatchByShopId.mockRejectedValue(error);

      await expectError(await get(), 500, "An internal server error occurred.");
    }
  );
});
