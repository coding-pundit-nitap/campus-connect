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

export const logger = loggers.worker;

export const BATCH_CLOSER_SCHEDULER_ID = "batch-closer-job";

export const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing workers...");
  await Promise.all([
    notificationWorker.close(),
    auditWorker.close(),
    batchCloserWorker.close(),
    closeBatchCloserQueues(),
    closeNotificationDlqQueue(),
  ]);
  await redisPublisher.quit();
  await prisma.$disconnect();
  logger.info("Workers closed. Exiting.");
  process.exit(0);
};

/** Drops any stale schedulers, then (re)registers the per-minute batch closer. */
export async function syncBatchCloserSchedule(
  queue: Pick<
    typeof batchCloserQueue,
    "getJobSchedulers" | "removeJobScheduler" | "upsertJobScheduler"
  > = batchCloserQueue
): Promise<void> {
  const schedulers = await queue.getJobSchedulers();
  for (const scheduler of schedulers) {
    if (scheduler.id) {
      await queue.removeJobScheduler(scheduler.id);
    }
  }

  await queue.upsertJobScheduler(
    BATCH_CLOSER_SCHEDULER_ID,
    { pattern: "* * * * *" },
    {
      opts: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }
  );
}

export async function main() {
  try {
    await syncBatchCloserSchedule();
    logger.info("🚀 Worker Service Initialized");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize worker service");
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

main();
