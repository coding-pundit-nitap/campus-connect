import { Job, Worker } from "bullmq";

import { prisma } from "@/lib/prisma";
import { redisPublisher } from "@/lib/redis";
import { redisConnection } from "@/lib/redis-connection";

import {
  NOTIFICATION_QUEUE_NAME,
  NotificationJobData,
} from "./notification-producer";

export const notificationWorker = new Worker<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  async (job: Job<NotificationJobData>) => {
    console.log(`Processing notification job ${job.id}: ${job.data.type}`);

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
        console.log(`Notification sent to user ${user_id}`);
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
        console.log(`Broadcast notification sent: ${newBroadcast.title}`);
      }
    } catch (error) {
      console.error(`Failed to process notification job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

notificationWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job?.id} failed: ${err.message}`);
});
