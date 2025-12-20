import { loggers } from "./lib/logger";
import { notificationWorker } from "./notification/consumer";
import { searchWorker } from "./search/consumer";

const logger = loggers.worker;

logger.info("🚀 Worker Service Initialized");

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing workers...");
  await Promise.all([searchWorker.close(), notificationWorker.close()]);
  logger.info("Workers closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
