import { Queue } from "bullmq";

import { auditWorker } from "./audit/consumer";
import { batchCloserWorker } from "./batch/batch-closer";
import { loggers } from "./lib/logger";
import { redisConnection } from "./lib/redis-connection";
import {
  closeNotificationDlqQueue,
  notificationWorker,
} from "./notification/consumer";

export const logger = loggers.worker;

const BATCH_CLOSER_QUEUE_NAME = "batch-closer-queue";
const cronQueue = new Queue(BATCH_CLOSER_QUEUE_NAME, {
  connection: redisConnection,
});

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing workers...");
  await Promise.all([
    notificationWorker.close(),
    auditWorker.close(),
    batchCloserWorker.close(),
    cronQueue.close(),
    closeNotificationDlqQueue(),
  ]);
  logger.info("Workers closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

async function main() {
  try {
    // Clean up existing repeatable jobs to avoid duplicates, then add
    const repeatableJobs = await cronQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await cronQueue.removeRepeatableByKey(job.key);
    }

    await cronQueue.add(
      "batch-closer-job",
      {},
      {
        repeat: { pattern: "* * * * *" },
      }
    );

    logger.info("🚀 Worker Service Initialized");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize worker service");
    process.exit(1);
  }
}

main();
