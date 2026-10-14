import { Queue, Worker } from "bullmq";
import type { Logger } from "pino";

import { batchService } from "../di/container.js";
import { loggers } from "../lib/logger.js";
import { redisConnection } from "../lib/redis-connection.js";

const logger = loggers.worker.child({ module: "batch-closer" });
export const BATCH_CLOSER_QUEUE_NAME = "batch-closer-queue";

export const batchCloserQueue = new Queue(BATCH_CLOSER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export async function closeBatchCloserQueues(): Promise<void> {
  await batchCloserQueue.close();
}

/** Never throws: a failed tick is logged and retried on the next schedule. */
export async function runBatchCloserLogic(
  service: Pick<typeof batchService, "autoCloseExpiredBatches"> = batchService,
  log: Logger = logger
): Promise<void> {
  try {
    await service.autoCloseExpiredBatches();
  } catch (error) {
    log.error({ err: error }, "🔥 Error in Batch Closer main loop");
  }
}

export async function processBatchCloserJob(
  service: Pick<typeof batchService, "autoCloseExpiredBatches"> = batchService,
  log: Logger = logger
): Promise<void> {
  log.info("Executing batch closer job...");
  await runBatchCloserLogic(service, log);
}

export const batchCloserWorker = new Worker(
  BATCH_CLOSER_QUEUE_NAME,
  async () => processBatchCloserJob(),
  { connection: redisConnection }
);

batchCloserWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Batch closer job completed");
});

batchCloserWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Batch closer job failed");
});
