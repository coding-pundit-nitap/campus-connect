import { auditWorker } from "./audit/consumer";
import { ensureIndicesExist } from "./lib/elasticsearch";
import { loggers } from "./lib/logger";
import { notificationWorker } from "./notification/consumer";
import { searchWorker } from "./search/consumer";

export const logger = loggers.worker;

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing workers...");
  await Promise.all([
    searchWorker.close(),
    notificationWorker.close(),
    auditWorker.close(),
  ]);
  logger.info("Workers closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

async function main() {
  try {
    logger.info("🔧 Ensuring Elasticsearch indices exist...");
    await ensureIndicesExist();
    logger.info("✅ Elasticsearch indices ready");
    logger.info("🚀 Worker Service Initialized");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize Elasticsearch indices");
    process.exit(1);
  }
}

main();
