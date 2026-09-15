import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  redisPublisher: { publish: vi.fn() },
}));

import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import { redisPublisher } from "@/lib/redis";

describe("publishBatchProgress", () => {
  it("publishes to the shop-scoped channel with a JSON payload", async () => {
    await publishBatchProgress({
      batchId: "batch-1",
      shopId: "shop-1",
      status: "OPEN",
      collectiveTotal: 200,
      minRequired: 500,
    });

    expect(redisPublisher.publish).toHaveBeenCalledWith(
      "shop:shop-1:batch-progress",
      JSON.stringify({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 200,
        minRequired: 500,
      })
    );
  });

  it("swallows publish errors instead of throwing", async () => {
    (redisPublisher.publish as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("redis down")
    );

    await expect(
      publishBatchProgress({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 200,
        minRequired: 500,
      })
    ).resolves.toBeUndefined();
  });
});
