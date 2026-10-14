import { Queue } from "bullmq";

import {
  NOTIFICATION_QUEUE_NAME,
  type NotificationJobData,
} from "../../notification/types.js";
import { redisConnection } from "../redis-connection.js";

export { NOTIFICATION_QUEUE_NAME, type NotificationJobData };

export const notificationQueue = new Queue<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  }
);
