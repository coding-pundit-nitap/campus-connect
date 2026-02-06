import { auditWorker } from "./audit/consumer";
import { startBatchCloser } from "./batch/batch-closer";
import { loggers } from "./lib/logger";
import { notificationWorker } from "./notification/consumer";

export const logger = loggers.worker;

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing workers...");
  await Promise.all([notificationWorker.close(), auditWorker.close()]);
  logger.info("Workers closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

async function main() {
  try {
    startBatchCloser();

    logger.info("🚀 Worker Service Initialized");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize worker service");
    process.exit(1);
  }
}

main();
