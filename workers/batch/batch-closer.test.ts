import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fakeLogger,
  FakeQueue,
  FakeWorker,
} from "../../tests/helpers/workers/index.js";
import { batchService } from "../di/container.js";
import { loggers } from "../lib/logger.js";
import {
  BATCH_CLOSER_QUEUE_NAME,
  batchCloserQueue,
  batchCloserWorker,
  closeBatchCloserQueues,
  processBatchCloserJob,
  runBatchCloserLogic,
} from "./batch-closer.js";

vi.mock("bullmq", async () =>
  (await import("../../tests/helpers/workers/index.js")).bullmqModule()
);
vi.mock("../lib/logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("../di/container.js", () => ({
  batchService: { autoCloseExpiredBatches: vi.fn() },
}));
vi.mock("../lib/redis-connection.js", () => ({
  redisConnection: { host: "test-redis", port: 6379 },
}));

const connection = { host: "test-redis", port: 6379 };

beforeEach(vi.clearAllMocks);

describe("runBatchCloserLogic", () => {
  it("auto-closes expired batches", async () => {
    const service = { autoCloseExpiredBatches: vi.fn() };

    await runBatchCloserLogic(service, fakeLogger());

    expect(service.autoCloseExpiredBatches).toHaveBeenCalledTimes(1);
  });

  it("logs and swallows failures so the scheduler keeps running", async () => {
    const failure = new Error("db down");
    const service = {
      autoCloseExpiredBatches: vi.fn().mockRejectedValue(failure),
    };
    const log = fakeLogger();

    await expect(runBatchCloserLogic(service, log)).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledWith(
      { err: failure },
      "🔥 Error in Batch Closer main loop"
    );
  });

  it("uses the container's batch service by default", async () => {
    await runBatchCloserLogic();

    expect(batchService.autoCloseExpiredBatches).toHaveBeenCalledTimes(1);
  });
});

describe("processBatchCloserJob", () => {
  it("logs and runs the closer logic", async () => {
    const service = { autoCloseExpiredBatches: vi.fn() };
    const log = fakeLogger();

    await processBatchCloserJob(service, log);

    expect(log.info).toHaveBeenCalledWith("Executing batch closer job...");
    expect(service.autoCloseExpiredBatches).toHaveBeenCalledTimes(1);
  });
});

describe("batch closer wiring", () => {
  const worker = batchCloserWorker as unknown as FakeWorker;
  const queue = batchCloserQueue as unknown as FakeQueue;

  it("creates the queue with completed/failed job retention", () => {
    expect(queue.name).toBe(BATCH_CLOSER_QUEUE_NAME);
    expect(queue.opts).toEqual({
      connection,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
    });
  });

  it("closes the queue", async () => {
    await closeBatchCloserQueues();

    expect(queue.close).toHaveBeenCalledTimes(1);
  });

  it("consumes the queue and runs the closer per job", async () => {
    expect(worker.name).toBe(BATCH_CLOSER_QUEUE_NAME);
    expect(worker.opts).toEqual({ connection });

    await worker.processor({ id: "job-1" });

    expect(batchService.autoCloseExpiredBatches).toHaveBeenCalledTimes(1);
  });

  it("logs completed jobs", () => {
    worker.emit("completed", { id: "job-2" });

    expect(loggers.worker.debug).toHaveBeenCalledWith(
      { jobId: "job-2" },
      "Batch closer job completed"
    );
  });

  it.each([
    ["a job", { id: "job-3" }, "job-3"],
    ["no job", undefined, undefined],
  ])("logs failures for %s", (_label, job, jobId) => {
    const err = new Error("boom");

    worker.emit("failed", job, err);

    expect(loggers.worker.error).toHaveBeenCalledWith(
      { err, jobId },
      "Batch closer job failed"
    );
  });
});
