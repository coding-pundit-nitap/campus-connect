import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchProgressChannel,
  publishBatchProgress,
} from "./batch-progress-publisher.js";
import { loggers } from "./logger.js";
import { redisPublisher } from "./redis.js";

vi.mock("./logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("./redis.js", () => ({ redisPublisher: { publish: vi.fn() } }));

const payload = {
  batchId: "b1",
  shopId: "s1",
  status: "LOCKED",
  collectiveTotal: 500,
  minRequired: null,
};

describe("batchProgressChannel", () => {
  it("namespaces the channel by shop", () => {
    expect(batchProgressChannel("s1")).toBe("shop:s1:batch-progress");
  });
});

describe("publishBatchProgress", () => {
  beforeEach(vi.clearAllMocks);

  it("publishes the JSON payload on the shop channel", async () => {
    await publishBatchProgress(payload);

    expect(redisPublisher.publish).toHaveBeenCalledWith(
      "shop:s1:batch-progress",
      JSON.stringify(payload)
    );
  });

  it("logs and swallows publish failures", async () => {
    const failure = new Error("redis down");
    vi.mocked(redisPublisher.publish).mockRejectedValue(failure);

    await expect(publishBatchProgress(payload)).resolves.toBeUndefined();
    expect(loggers.batch.error).toHaveBeenCalledWith(
      { err: failure },
      "Failed to publish batch progress update"
    );
  });
});
