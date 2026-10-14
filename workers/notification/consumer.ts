import { Job, Queue, Worker } from "bullmq";
import type { Logger } from "pino";
import webpush from "web-push";

import { sendNotificationEmail } from "../lib/email.js";
import { env } from "../lib/env.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { redisPublisher } from "../lib/redis.js";
import { redisConnection } from "../lib/redis-connection.js";
import { NOTIFICATION_QUEUE_NAME, NotificationJobData } from "./types.js";

const logger = loggers.notification;

/** Web push payloads are capped at 4KB; long messages are truncated. */
export const PUSH_MESSAGE_MAX_LENGTH = 150;
/** Broadcast pushes are sent in chunks to bound memory/network pressure. */
export const BROADCAST_PUSH_CHUNK_SIZE = 100;

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NotificationDeps {
  prisma: Pick<
    typeof prisma,
    "notification" | "user" | "pushSubscription" | "broadcastNotification"
  >;
  redisPublisher: Pick<typeof redisPublisher, "publish">;
  webpush: Pick<typeof webpush, "sendNotification">;
  sendEmail: typeof sendNotificationEmail;
  logger: Logger;
}

const defaultDeps: NotificationDeps = {
  prisma,
  redisPublisher,
  webpush,
  sendEmail: sendNotificationEmail,
  logger,
};

type SendPayload = Extract<
  NotificationJobData["payload"],
  { type: "SEND_NOTIFICATION" }
>;
type BroadcastPayload = Extract<
  NotificationJobData["payload"],
  { type: "BROADCAST_NOTIFICATION" }
>;

export function configureWebPush(
  config: Pick<
    typeof env,
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY" | "VAPID_PRIVATE_KEY" | "VAPID_SUBJECT"
  > = env,
  client: Pick<typeof webpush, "setVapidDetails"> = webpush,
  log: Logger = logger
): boolean {
  if (
    config.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    config.VAPID_PRIVATE_KEY &&
    config.VAPID_SUBJECT
  ) {
    client.setVapidDetails(
      config.VAPID_SUBJECT,
      config.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      config.VAPID_PRIVATE_KEY
    );
    return true;
  }
  log.warn(
    "VAPID keys not fully configured. Web push notifications will fail."
  );
  return false;
}

configureWebPush();

export function buildPushPayload(notification: {
  title: string;
  message: string;
  action_url: string | null;
}): string {
  const safeMessage =
    notification.message.length > PUSH_MESSAGE_MAX_LENGTH
      ? notification.message.substring(0, PUSH_MESSAGE_MAX_LENGTH) + "..."
      : notification.message;

  return JSON.stringify({
    title: notification.title,
    message: safeMessage,
    action_url: notification.action_url,
  });
}

/**
 * Sends one push; deletes the subscription when the push service reports it
 * as gone (404/410), rethrows any other failure.
 */
export async function sendPushToSubscription(
  sub: PushSubscriptionKeys,
  payload: string,
  deps: Pick<NotificationDeps, "prisma" | "webpush" | "logger">
): Promise<void> {
  try {
    await deps.webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );
  } catch (pushError) {
    const err = pushError as { statusCode?: number };
    if (err.statusCode === 404 || err.statusCode === 410) {
      await deps.prisma.pushSubscription.deleteMany({
        where: { endpoint: sub.endpoint },
      });
      deps.logger.info(
        { endpoint: sub.endpoint },
        "Deleted stale push subscription"
      );
    } else {
      throw pushError;
    }
  }
}

/** Pushes to every subscription, `chunkSize` at a time, and tallies results. */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionKeys[],
  payload: string,
  deps: Pick<NotificationDeps, "prisma" | "webpush" | "logger">,
  chunkSize: number = Infinity
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < subscriptions.length; i += chunkSize) {
    const chunk = subscriptions.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map((sub) => sendPushToSubscription(sub, payload, deps))
    );
    for (const r of results) {
      if (r.status === "fulfilled") successCount++;
      else failCount++;
    }
  }

  return { successCount, failCount };
}

export async function processSendNotification(
  { user_id, data }: SendPayload,
  deps: NotificationDeps = defaultDeps
): Promise<void> {
  const log = deps.logger;
  const newNotification = await deps.prisma.notification.create({
    data: {
      ...data,
      user: { connect: { id: user_id } },
    },
  });

  const channel = `user:${user_id}:notifications`;
  await deps.redisPublisher.publish(channel, JSON.stringify(newNotification));

  try {
    const user = await deps.prisma.user.findUnique({
      where: { id: user_id },
      select: { email: true, name: true },
    });

    if (user?.email) {
      const sent = await deps.sendEmail({
        to: user.email,
        recipientName: user.name,
        title: newNotification.title,
        message: newNotification.message,
        actionUrl: newNotification.action_url,
      });

      if (sent) {
        log.info(
          { userId: user_id, notificationId: newNotification.id },
          "Notification email sent"
        );
      }
    }
  } catch (emailError) {
    log.error(
      { err: emailError, userId: user_id, notificationId: newNotification.id },
      "Failed to send notification email"
    );
  }

  try {
    const subscriptions = await deps.prisma.pushSubscription.findMany({
      where: { user_id },
    });

    if (subscriptions.length > 0) {
      const { failCount } = await sendPushToSubscriptions(
        subscriptions,
        buildPushPayload(newNotification),
        deps
      );

      if (failCount > 0) {
        log.warn(
          { failedCount: failCount, userId: user_id },
          "Some push notifications failed"
        );
      } else {
        log.info(
          { successCount: subscriptions.length, userId: user_id },
          "Web push notifications sent"
        );
      }
    }
  } catch (pushError) {
    log.error(
      { err: pushError, userId: user_id, notificationId: newNotification.id },
      "Failed to send web push notifications"
    );
  }

  log.info(
    { userId: user_id, notificationId: newNotification.id },
    "Notification sent to user"
  );
}

export async function processBroadcastNotification(
  { data }: BroadcastPayload,
  deps: NotificationDeps = defaultDeps
): Promise<void> {
  const log = deps.logger;
  const newBroadcast = await deps.prisma.broadcastNotification.create({
    data,
  });

  const channel = `broadcast:notifications`;
  await deps.redisPublisher.publish(channel, JSON.stringify(newBroadcast));
  log.info(
    { broadcastId: newBroadcast.id, title: newBroadcast.title },
    "Broadcast notification sent via SSE"
  );

  try {
    const subscriptions = await deps.prisma.pushSubscription.findMany({
      select: { endpoint: true, p256dh: true, auth: true },
    });

    if (subscriptions.length > 0) {
      const { successCount, failCount } = await sendPushToSubscriptions(
        subscriptions,
        buildPushPayload(newBroadcast),
        deps,
        BROADCAST_PUSH_CHUNK_SIZE
      );

      if (failCount > 0) {
        log.warn(
          {
            failedCount: failCount,
            successCount,
            broadcastId: newBroadcast.id,
          },
          "Some broadcast push notifications failed"
        );
      } else {
        log.info(
          { successCount, broadcastId: newBroadcast.id },
          "Broadcast web push notifications sent"
        );
      }
    }
  } catch (pushError) {
    log.error(
      { err: pushError, broadcastId: newBroadcast.id },
      "Failed to send broadcast web push notifications"
    );
  }
}

export async function processNotificationJob(
  job: Pick<Job<NotificationJobData>, "id" | "data">,
  deps: NotificationDeps = defaultDeps
): Promise<void> {
  deps.logger.debug(
    { jobId: job.id, type: job.data.type },
    "Processing notification job"
  );

  try {
    const { type, payload } = job.data;
    if (type === "SEND_NOTIFICATION" && payload.type === "SEND_NOTIFICATION") {
      await processSendNotification(payload, deps);
    } else if (
      type === "BROADCAST_NOTIFICATION" &&
      payload.type === "BROADCAST_NOTIFICATION"
    ) {
      await processBroadcastNotification(payload, deps);
    }
  } catch (error) {
    deps.logger.error(
      { err: error, jobId: job.id },
      "Failed to process notification job"
    );
    throw error;
  }
}

/** Moves a job to the DLQ once it has exhausted its retry attempts. */
export async function handleNotificationJobFailed(
  job:
    | Pick<Job<NotificationJobData>, "id" | "data" | "attemptsMade" | "opts">
    | undefined,
  err: Error,
  dlq: Pick<Queue, "add">,
  log: Logger = logger
): Promise<void> {
  log.error({ err, jobId: job?.id }, "Notification job failed");

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      await dlq.add(
        "dead-notification",
        {
          originalJob: job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade,
        },
        { removeOnComplete: false, removeOnFail: false }
      );
      log.warn({ jobId: job.id }, "Job moved to DLQ");
    } catch (error) {
      log.error({ err: error, jobId: job.id }, "Failed to enqueue job to DLQ");
    }
  }
}

export const notificationWorker = new Worker<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  (job) => processNotificationJob(job),
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

notificationWorker.on("failed", (job, err) =>
  handleNotificationJobFailed(job, err, dlqQueue)
);
