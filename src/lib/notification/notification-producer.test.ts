import { describe, expect, it, vi } from "vitest";

const Queue = vi.hoisted(() =>
  vi.fn(function (this: object, name: string, opts: object) {
    Object.assign(this, { name, opts });
  })
);

vi.mock("bullmq", () => ({ Queue }));
vi.mock("../redis-connection", () => ({
  redisConnection: { host: "redis-test", port: 1 },
}));

import {
  NOTIFICATION_QUEUE_NAME,
  notificationQueue,
} from "./notification-producer";

describe("notificationQueue", () => {
  it("is a BullMQ queue on the shared Redis connection with retry/backoff", () => {
    expect(NOTIFICATION_QUEUE_NAME).toBe("notification-queue");
    expect(Queue).toHaveBeenCalledWith("notification-queue", {
      connection: { host: "redis-test", port: 1 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
    expect(notificationQueue).toBe(Queue.mock.instances[0]);
  });
});
