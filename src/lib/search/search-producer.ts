import { Queue } from "bullmq";

import { redisConnection } from "@/lib/redis-connection";

export const SEARCH_QUEUE_NAME = "search-sync-queue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SearchJobData<T = Record<string, any>> {
  type:
    | "INDEX_SHOP"
    | "DELETE_SHOP"
    | "INDEX_PRODUCT"
    | "DELETE_PRODUCT"
    | "INDEX_ORDER"
    | "UPDATE_ORDER_STATUS"
    | "INDEX_USER"
    | "DELETE_USER";
  payload: T;
}

export const searchQueue = new Queue<SearchJobData>(SEARCH_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});
