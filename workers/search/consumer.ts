import { Job, Worker } from "bullmq";

import {
  elasticClient,
  INDICES,
  isDocumentMissingError,
} from "../lib/elasticsearch";
import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redisConnection } from "../lib/redis-connection";
import { SEARCH_QUEUE_NAME, SearchJobData } from "./types";

const logger = loggers.search;

logger.info(`Starting Search Worker for queue: ${SEARCH_QUEUE_NAME}`);

const workerHandler = async (job: Job<SearchJobData>) => {
  const start = Date.now();
  logger.debug({ jobId: job.id, type: job.data.type }, "Processing search job");

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
        try {
          await elasticClient.update({
            index: INDICES.ORDERS,
            id: job.data.payload.id,
            doc: { status: job.data.payload.status },
          });
        } catch (error) {
          if (isDocumentMissingError(error)) {
            logger.warn(
              { jobId: job.id, orderId: job.data.payload.id },
              "Document missing during update, fetching from DB and indexing..."
            );
            const order = await prisma.order.findUnique({
              where: { id: job.data.payload.id },
              include: { user: true },
            });

            if (order) {
              await elasticClient.index({
                index: INDICES.ORDERS,
                id: order.id,
                document: {
                  id: order.id,
                  shop_id: order.shop_id,
                  display_id: order.display_id,
                  user_email: order.user?.email,
                  delivery_address: order.delivery_address_snapshot,
                  status: order.order_status,
                  created_at: order.created_at,
                },
              });
              logger.info(
                { jobId: job.id, orderId: order.id },
                "Successfully indexed missing order"
              );
            } else {
              logger.error(
                { jobId: job.id, orderId: job.data.payload.id },
                "Order not found in DB either"
              );
              throw error;
            }
          } else {
            throw error;
          }
        }
        break;
      }

      // --- USERS ---
      case "INDEX_USER": {
        await elasticClient.index({
          index: INDICES.USERS,
          id: job.data.payload.id,
          document: job.data.payload,
        });
        break;
      }
      case "DELETE_USER": {
        await elasticClient.delete({
          index: INDICES.USERS,
          id: job.data.payload.id,
        });
        break;
      }

      // --- CATEGORIES ---
      case "INDEX_CATEGORY": {
        await elasticClient.index({
          index: INDICES.CATEGORIES,
          id: job.data.payload.id,
          document: job.data.payload,
        });
        break;
      }
      case "DELETE_CATEGORY": {
        await elasticClient.delete({
          index: INDICES.CATEGORIES,
          id: job.data.payload.id,
        });
        break;
      }

      default:
        logger.warn({ jobId: job.id, type: job.data.type }, "Unknown job type");
    }

    const duration = Date.now() - start;
    logger.debug({ jobId: job.id, duration }, "Search job completed");
  } catch (error) {
    logger.error({ err: error, jobId: job.id }, "Search job failed");
    throw error;
  }
};

export const searchWorker = new Worker(SEARCH_QUEUE_NAME, workerHandler, {
  connection: redisConnection,
  concurrency: 5,
  lockDuration: 30000,
});

searchWorker.on("failed", (job, err) => {
  logger.error(
    { err, jobId: job?.id },
    "Search job failed completely after all attempts"
  );
});
