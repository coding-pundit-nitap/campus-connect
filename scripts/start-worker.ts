import { notificationWorker } from "../src/lib/notification/notification-consumer";
import { searchWorker } from "../src/lib/search/search-consumer";

console.log("🚀 Worker Service Initialized");

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing worker...`);
  await Promise.all([searchWorker.close(), notificationWorker.close()]);
  console.log("Worker closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
