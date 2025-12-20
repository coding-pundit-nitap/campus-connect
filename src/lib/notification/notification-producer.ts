import { Queue } from "bullmq";

import { Prisma } from "@/../prisma/generated/client";

import { redisConnection } from "../redis-connection";

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

export interface NotificationJobData {
  type: "SEND_NOTIFICATION" | "BROADCAST_NOTIFICATION";
  payload:
    | {
        type: "SEND_NOTIFICATION";
        user_id: string;
        data: Prisma.NotificationCreateWithoutUserInput;
      }
    | {
        type: "BROADCAST_NOTIFICATION";
        data: Prisma.BroadcastNotificationCreateInput;
      };
}

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
