import { Job, Queue, Worker } from "bullmq";
import webpush from "web-push";

import { env } from "../../src/config/env.config";
import { sendNotificationEmail } from "../lib/email";
import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redisPublisher } from "../lib/redis";
import { redisConnection } from "../lib/redis-connection";
import { NOTIFICATION_QUEUE_NAME, NotificationJobData } from "./types";

const logger = loggers.notification;

if (
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  env.VAPID_PRIVATE_KEY &&
  env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
} else {
  logger.warn(
    "VAPID keys not fully configured. Web push notifications will fail."
  );
}

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

      try {
        const user = await prisma.user.findUnique({
          where: { id: user_id },
          select: { email: true, name: true },
        });

        if (user?.email) {
          const sent = await sendNotificationEmail({
            to: user.email,
            recipientName: user.name,
            title: newNotification.title,
            message: newNotification.message,
            actionUrl: newNotification.action_url,
          });

          if (sent) {
            logger.info(
              { userId: user_id, notificationId: newNotification.id },
              "Notification email sent"
            );
          }
        }
      } catch (emailError) {
        logger.error(
          {
            err: emailError,
            userId: user_id,
            notificationId: newNotification.id,
          },
          "Failed to send notification email"
        );
      }

      // Web Push Notifications
      try {
        const subscriptions = await prisma.pushSubscription.findMany({
          where: { user_id },
        });

        if (subscriptions.length > 0) {
          // Truncate payload if it's too large (4KB limit)
          const MAX_LENGTH = 150;
          const safeMessage =
            newNotification.message.length > MAX_LENGTH
              ? newNotification.message.substring(0, MAX_LENGTH) + "..."
              : newNotification.message;

          const payload = JSON.stringify({
            title: newNotification.title,
            message: safeMessage,
            action_url: newNotification.action_url,
          });

          const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload
                );
              } catch (pushError) {
                const err = pushError as { statusCode?: number };
                // If subscription is invalid/expired (404/410), delete it
                if (err.statusCode === 404 || err.statusCode === 410) {
                  await prisma.pushSubscription.deleteMany({
                    where: { endpoint: sub.endpoint },
                  });
                  logger.info(
                    { endpoint: sub.endpoint },
                    "Deleted stale push subscription"
                  );
                } else {
                  throw pushError;
                }
              }
            })
          );

          const failedPushes = results.filter((r) => r.status === "rejected");
          if (failedPushes.length > 0) {
            logger.warn(
              { failedCount: failedPushes.length, userId: user_id },
              "Some push notifications failed"
            );
          } else {
            logger.info(
              { successCount: subscriptions.length, userId: user_id },
              "Web push notifications sent"
            );
          }
        }
      } catch (pushError) {
        logger.error(
          {
            err: pushError,
            userId: user_id,
            notificationId: newNotification.id,
          },
          "Failed to send web push notifications"
        );
      }

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
        "Broadcast notification sent via SSE"
      );

      // Web Push Notifications for Broadcast
      try {
        const subscriptions = await prisma.pushSubscription.findMany({
          select: { endpoint: true, p256dh: true, auth: true },
        });

        if (subscriptions.length > 0) {
          const MAX_LENGTH = 150;
          const safeMessage =
            newBroadcast.message.length > MAX_LENGTH
              ? newBroadcast.message.substring(0, MAX_LENGTH) + "..."
              : newBroadcast.message;

          const payload = JSON.stringify({
            title: newBroadcast.title,
            message: safeMessage,
            action_url: newBroadcast.action_url,
          });

          // Process in chunks to avoid memory/network bottleneck
          const CHUNK_SIZE = 100;
          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < subscriptions.length; i += CHUNK_SIZE) {
            const chunk = subscriptions.slice(i, i + CHUNK_SIZE);
            const results = await Promise.allSettled(
              chunk.map(async (sub) => {
                try {
                  await webpush.sendNotification(
                    {
                      endpoint: sub.endpoint,
                      keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload
                  );
                } catch (pushError) {
                  const err = pushError as { statusCode?: number };
                  // If subscription is invalid/expired (404/410), delete it
                  if (err.statusCode === 404 || err.statusCode === 410) {
                    await prisma.pushSubscription.deleteMany({
                      where: { endpoint: sub.endpoint },
                    });
                    logger.info(
                      { endpoint: sub.endpoint },
                      "Deleted stale push subscription"
                    );
                  } else {
                    throw pushError;
                  }
                }
              })
            );

            successCount += results.filter(
              (r) => r.status === "fulfilled"
            ).length;
            failCount += results.filter((r) => r.status === "rejected").length;
          }

          if (failCount > 0) {
            logger.warn(
              {
                failedCount: failCount,
                successCount,
                broadcastId: newBroadcast.id,
              },
              "Some broadcast push notifications failed"
            );
          } else {
            logger.info(
              { successCount, broadcastId: newBroadcast.id },
              "Broadcast web push notifications sent"
            );
          }
        }
      } catch (pushError) {
        logger.error(
          {
            err: pushError,
            broadcastId: newBroadcast.id,
          },
          "Failed to send broadcast web push notifications"
        );
      }
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
const dlqQueue = new Queue("notification-dlq", { connection: redisConnection });

export async function closeNotificationDlqQueue(): Promise<void> {
  await dlqQueue.close();
}

notificationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Notification job completed");
});

notificationWorker.on("failed", async (job, err) => {
  logger.error({ err, jobId: job?.id }, "Notification job failed");

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      await dlqQueue.add(
        "dead-notification",
        {
          originalJob: job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade,
        },
        { removeOnComplete: false, removeOnFail: false }
      );
      logger.warn({ jobId: job.id }, "Job moved to DLQ");
    } catch (error) {
      logger.error(
        { err: error, jobId: job.id },
        "Failed to enqueue job to DLQ"
      );
    }
  }
});
