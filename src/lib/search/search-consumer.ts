import { Job, Worker } from "bullmq";

import { elasticClient, INDICES } from "@/lib/elasticsearch";
import { redisConnection } from "@/lib/redis-connection";
import { SEARCH_QUEUE_NAME, SearchJobData } from "@/lib/search/search-producer";

console.log(`[Worker] Starting Search Worker for queue: ${SEARCH_QUEUE_NAME}`);

const workerHandler = async (job: Job<SearchJobData>) => {
  const start = Date.now();
  console.log(`[Job ${job.id}] Processing ${job.data.type}...`);

  try {
    switch (job.data.type) {
      // --- SHOPS ---
      case "INDEX_SHOP": {
        await elasticClient.index({
          index: INDICES.SHOPS,
          id: job.data.payload.id,
          document: job.data.payload,
        });
        break;
      }
      case "DELETE_SHOP": {
        await elasticClient.delete({
          index: INDICES.SHOPS,
          id: job.data.payload.id,
        });
        break;
      }

      // --- PRODUCTS ---
      case "INDEX_PRODUCT": {
        await elasticClient.index({
          index: INDICES.PRODUCTS,
          id: job.data.payload.id,
          document: job.data.payload,
        });
        break;
      }
      case "DELETE_PRODUCT": {
        await elasticClient.delete({
          index: INDICES.PRODUCTS,
          id: job.data.payload.id,
        });
        break;
      }

      // --- ORDERS ---
      case "INDEX_ORDER": {
        await elasticClient.index({
          index: INDICES.ORDERS,
          id: job.data.payload.id,
          document: job.data.payload,
        });
        break;
      }
      case "UPDATE_ORDER_STATUS": {
        await elasticClient.update({
          index: INDICES.ORDERS,
          id: job.data.payload.id,
          doc: { status: job.data.payload.status },
        });
        break;
      }

      default:
        console.warn(`[Job ${job.id}] Unknown job type: ${job.data}`);
    }

    const duration = Date.now() - start;
    console.log(`[Job ${job.id}] Completed in ${duration}ms`);
  } catch (error) {
    console.error(`[Job ${job.id}] Failed:`, error);
    throw error;
  }
};

export const searchWorker = new Worker(SEARCH_QUEUE_NAME, workerHandler, {
  connection: redisConnection,
  concurrency: 5,
  lockDuration: 30000,
});

searchWorker.on("failed", (job, err) => {
  console.error(
    `[Job ${job?.id}] Failed completely after all attempts: ${err.message}`
  );
});
