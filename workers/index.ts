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

const gracefulShutdown = async (signal: string) => {
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

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

async function main() {
  try {
    const schedulers = await batchCloserQueue.getJobSchedulers();
    for (const scheduler of schedulers) {
      if (scheduler.id) {
        await batchCloserQueue.removeJobScheduler(scheduler.id);
      }
    }

    await batchCloserQueue.upsertJobScheduler(
      "batch-closer-job",
      { pattern: "* * * * *" },
      {
        opts: {
          removeOnComplete: true,
          removeOnFail: 100,
        },
      }
    );

    logger.info("🚀 Worker Service Initialized");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize worker service");
    process.exit(1);
  }
}

main();
