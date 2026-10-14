import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { auditWorker } from "./audit/consumer.js";
import {
  batchCloserQueue,
  batchCloserWorker,
  closeBatchCloserQueues,
} from "./batch/batch-closer.js";
import { loggers } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { redisPublisher } from "./lib/redis.js";
import {
  closeNotificationDlqQueue,
  notificationWorker,
} from "./notification/consumer.js";

vi.mock("./lib/logger.js", async () =>
  (await import("../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("./audit/consumer.js", () => ({ auditWorker: { close: vi.fn() } }));
vi.mock("./notification/consumer.js", () => ({
  notificationWorker: { close: vi.fn() },
  closeNotificationDlqQueue: vi.fn(),
}));
vi.mock("./batch/batch-closer.js", () => ({
  batchCloserWorker: { close: vi.fn() },
  closeBatchCloserQueues: vi.fn(),
  batchCloserQueue: {
    getJobSchedulers: vi.fn().mockResolvedValue([]),
    removeJobScheduler: vi.fn(),
    upsertJobScheduler: vi.fn(),
  },
}));
vi.mock("./lib/prisma.js", () => ({ prisma: { $disconnect: vi.fn() } }));
vi.mock("./lib/redis.js", () => ({ redisPublisher: { quit: vi.fn() } }));

const { onSpy, exitSpy } = vi.hoisted(() => ({
  onSpy: vi.spyOn(process, "on").mockImplementation(() => process),
  exitSpy: vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never),
}));

const worker = await import("./index.js");
// Snapshot what the import registered before any test clears the mocks.
const registered = new Map(
  onSpy.mock.calls.map(([event, handler]) => [event, handler])
);

afterAll(() => {
  onSpy.mockRestore();
  exitSpy.mockRestore();
});

const queue = vi.mocked(batchCloserQueue);

describe("worker entrypoint on import", () => {
  it("registers SIGINT and SIGTERM handlers", () => {
    expect([...registered.keys()]).toEqual(
      expect.arrayContaining(["SIGINT", "SIGTERM"])
    );
  });

  it("schedules the batch closer", () => {
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      worker.BATCH_CLOSER_SCHEDULER_ID,
      expect.anything(),
      expect.anything()
    );
  });

  it.each(["SIGINT", "SIGTERM"])("shuts down gracefully on %s", async (sig) => {
    const handler = registered.get(sig) as () => Promise<void>;
    vi.clearAllMocks();

    await handler();

    expect(loggers.worker.info).toHaveBeenCalledWith(
      { signal: sig },
      "Received shutdown signal, closing workers..."
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});

describe("gracefulShutdown", () => {
  beforeEach(vi.clearAllMocks);

  it("closes workers and queues, then Redis and Prisma, then exits 0", async () => {
    const order: string[] = [];
    vi.mocked(redisPublisher.quit).mockImplementation(async () => {
      order.push("redis");
      return "OK";
    });
    vi.mocked(prisma.$disconnect).mockImplementation(async () => {
      order.push("prisma");
    });
    exitSpy.mockImplementationOnce((() => {
      order.push("exit");
    }) as never);

    await worker.gracefulShutdown("SIGTERM");

    expect(notificationWorker.close).toHaveBeenCalledTimes(1);
    expect(auditWorker.close).toHaveBeenCalledTimes(1);
    expect(batchCloserWorker.close).toHaveBeenCalledTimes(1);
    expect(closeBatchCloserQueues).toHaveBeenCalledTimes(1);
    expect(closeNotificationDlqQueue).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["redis", "prisma", "exit"]);
    expect(loggers.worker.info).toHaveBeenCalledWith(
      "Workers closed. Exiting."
    );
  });
});

describe("syncBatchCloserSchedule", () => {
  beforeEach(vi.clearAllMocks);

  it("removes existing schedulers that have an id, then upserts the per-minute job", async () => {
    const q = {
      getJobSchedulers: vi
        .fn()
        .mockResolvedValue([
          { id: "old-1" },
          { id: undefined },
          { id: "old-2" },
        ]),
      removeJobScheduler: vi.fn(),
      upsertJobScheduler: vi.fn(),
    };

    await worker.syncBatchCloserSchedule(q as never);

    expect(q.removeJobScheduler.mock.calls).toEqual([["old-1"], ["old-2"]]);
    expect(q.upsertJobScheduler).toHaveBeenCalledWith(
      "batch-closer-job",
      { pattern: "* * * * *" },
      { opts: { removeOnComplete: true, removeOnFail: 100 } }
    );
  });
});

describe("main", () => {
  beforeEach(vi.clearAllMocks);

  it("syncs the schedule on the batch closer queue and logs readiness", async () => {
    await worker.main();

    expect(queue.upsertJobScheduler).toHaveBeenCalledTimes(1);
    expect(loggers.worker.info).toHaveBeenCalledWith(
      "🚀 Worker Service Initialized"
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("logs and exits 1 when scheduling fails", async () => {
    const failure = new Error("redis down");
    queue.getJobSchedulers.mockRejectedValueOnce(failure);

    await worker.main();

    expect(loggers.worker.error).toHaveBeenCalledWith(
      { err: failure },
      "Failed to initialize worker service"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exports the worker logger", () => {
    expect(worker.logger).toBe(loggers.worker);
  });
});
