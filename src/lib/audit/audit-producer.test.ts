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

import { AUDIT_QUEUE_NAME, auditQueue } from "./audit-producer";

describe("auditQueue", () => {
  it("is a BullMQ queue on the shared Redis connection with retry/backoff", () => {
    expect(AUDIT_QUEUE_NAME).toBe("audit-log-queue");
    expect(Queue).toHaveBeenCalledWith("audit-log-queue", {
      connection: { host: "redis-test", port: 1 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
    expect(auditQueue).toBe(Queue.mock.instances[0]);
  });
});
