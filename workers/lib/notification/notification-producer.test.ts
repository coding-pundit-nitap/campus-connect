import { describe, expect, it, vi } from "vitest";

import type { FakeQueue } from "../../../tests/helpers/workers/index.js";
import * as types from "../../notification/types.js";
import {
  NOTIFICATION_QUEUE_NAME,
  notificationQueue,
} from "./notification-producer.js";

vi.mock("bullmq", async () =>
  (await import("../../../tests/helpers/workers/index.js")).bullmqModule()
);
vi.mock("../redis-connection.js", () => ({
  redisConnection: { host: "test-redis", port: 6379 },
}));

describe("notificationQueue", () => {
  it("shares the queue name with the consumer", () => {
    expect(NOTIFICATION_QUEUE_NAME).toBe(types.NOTIFICATION_QUEUE_NAME);
  });

  it("retries 3 times with exponential backoff", () => {
    const queue = notificationQueue as unknown as FakeQueue;

    expect(queue.name).toBe("notification-queue");
    expect(queue.opts).toEqual({
      connection: { host: "test-redis", port: 6379 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
  });
});
