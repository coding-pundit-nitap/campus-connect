import { Job, Worker } from "bullmq";

import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redisPublisher } from "../lib/redis";
import { redisConnection } from "../lib/redis-connection";
import { NOTIFICATION_QUEUE_NAME, NotificationJobData } from "./types";

const logger = loggers.notification;

const workHandler = async (job: Job<NotificationJobData>) => {
  logger.debug(
    { jobId: job.id, type: job.data.type },
    "Processing notification job"
  );

  try {
    if (
      job.data.type === "SEND_NOTIFICATION" &&
      job.data.payload.type === "SEND_NOTIFICATION"
    ) {
      const { user_id, data } = job.data.payload;

      const newNotification = await prisma.notification.create({
        data: {
          ...data,
          user: { connect: { id: user_id } },
        },
      });

      const channel = `user:${user_id}:notifications`;
      await redisPublisher.publish(channel, JSON.stringify(newNotification));
      logger.info(
        { userId: user_id, notificationId: newNotification.id },
        "Notification sent to user"
      );
    } else if (
      job.data.type === "BROADCAST_NOTIFICATION" &&
      job.data.payload.type === "BROADCAST_NOTIFICATION"
    ) {
      const { data } = job.data.payload;

      const newBroadcast = await prisma.broadcastNotification.create({
        data,
      });

      const channel = `broadcast:notifications`;
      await redisPublisher.publish(channel, JSON.stringify(newBroadcast));
      logger.info(
        { broadcastId: newBroadcast.id, title: newBroadcast.title },
        "Broadcast notification sent"
      );
    }
  } catch (error) {
    logger.error(
      { err: error, jobId: job.id },
      "Failed to process notification job"
    );
    throw error;
  }
};

export const notificationWorker = new Worker<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  workHandler,
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

notificationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Notification job completed");
});

notificationWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Notification job failed");
});
