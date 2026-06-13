import { Queue, Worker } from "bullmq";

import { batchService } from "../../src/di/container";
import { loggers } from "../lib/logger";
import { redisConnection } from "../lib/redis-connection";

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

export async function runBatchCloserLogic(): Promise<void> {
  try {
    await batchService.autoCloseExpiredBatches();
  } catch (error) {
    logger.error({ err: error }, "🔥 Error in Batch Closer main loop");
  }
}

export const batchCloserWorker = new Worker(
  BATCH_CLOSER_QUEUE_NAME,
  async (_job) => {
    logger.info("Executing batch closer job...");
    await runBatchCloserLogic();
  },
  { connection: redisConnection }
);

batchCloserWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Batch closer job completed");
});

batchCloserWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Batch closer job failed");
});
