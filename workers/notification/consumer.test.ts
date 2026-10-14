import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";

import {
  fakeLogger,
  FakeQueue,
  FakeWorker,
} from "../../tests/helpers/workers/index.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import {
  BROADCAST_PUSH_CHUNK_SIZE,
  buildPushPayload,
  closeNotificationDlqQueue,
  configureWebPush,
  handleNotificationJobFailed,
  type NotificationDeps,
  notificationWorker,
  processBroadcastNotification,
  processNotificationJob,
  processSendNotification,
  PUSH_MESSAGE_MAX_LENGTH,
  sendPushToSubscription,
  sendPushToSubscriptions,
} from "./consumer.js";
import { NOTIFICATION_QUEUE_NAME, type NotificationJobData } from "./types.js";

vi.mock("bullmq", async () =>
  (await import("../../tests/helpers/workers/index.js")).bullmqModule()
);
vi.mock("../lib/logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));
vi.mock("../lib/email.js", () => ({ sendNotificationEmail: vi.fn() }));
vi.mock("../lib/env.js", () => ({
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub",
    VAPID_PRIVATE_KEY: "priv",
    VAPID_SUBJECT: "mailto:ops@example.com",
  },
}));
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    notification: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    pushSubscription: { findMany: vi.fn(), deleteMany: vi.fn() },
    broadcastNotification: { create: vi.fn() },
  },
}));
vi.mock("../lib/redis.js", () => ({ redisPublisher: { publish: vi.fn() } }));
vi.mock("../lib/redis-connection.js", () => ({
  redisConnection: { host: "test-redis", port: 6379 },
}));

type Fn = ReturnType<typeof vi.fn>;
type TestDeps = NotificationDeps & {
  prisma: {
    notification: { create: Fn };
    user: { findUnique: Fn };
    pushSubscription: { findMany: Fn; deleteMany: Fn };
    broadcastNotification: { create: Fn };
  };
  redisPublisher: { publish: Fn };
  webpush: { sendNotification: Fn };
  sendEmail: Fn;
};

function makeDeps(): TestDeps {
  return {
    prisma: {
      notification: { create: vi.fn() },
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      pushSubscription: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn(),
      },
      broadcastNotification: { create: vi.fn() },
    },
    redisPublisher: { publish: vi.fn() },
    webpush: { sendNotification: vi.fn() },
    sendEmail: vi.fn(),
    logger: fakeLogger(),
  } as unknown as TestDeps;
}

const sub = (n: number) => ({
  endpoint: `https://push.example/${n}`,
  p256dh: `p${n}`,
  auth: `a${n}`,
});

const notification = {
  id: "notif-1",
  title: "Order ready",
  message: "Your order is ready",
  action_url: "/orders/1",
};

const sendPayload = {
  type: "SEND_NOTIFICATION" as const,
  user_id: "user-1",
  data: { title: "Order ready", message: "Your order is ready" },
};

const broadcastPayload = {
  type: "BROADCAST_NOTIFICATION" as const,
  data: { title: "Maintenance", message: "Down at 2am" },
};

const statusError = (statusCode: number) =>
  Object.assign(new Error(`push ${statusCode}`), { statusCode });

beforeEach(vi.clearAllMocks);

describe("configureWebPush", () => {
  it("sets VAPID details when all keys are present", () => {
    const client = { setVapidDetails: vi.fn() };
    const log = fakeLogger();

    const ok = configureWebPush(
      {
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub",
        VAPID_PRIVATE_KEY: "priv",
        VAPID_SUBJECT: "mailto:x@y.z",
      },
      client,
      log
    );

    expect(ok).toBe(true);
    expect(client.setVapidDetails).toHaveBeenCalledWith(
      "mailto:x@y.z",
      "pub",
      "priv"
    );
    expect(log.warn).not.toHaveBeenCalled();
  });

  it.each([
    ["public key", { NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" }],
    ["private key", { VAPID_PRIVATE_KEY: "" }],
    ["subject", { VAPID_SUBJECT: "" }],
  ])("warns and skips setup when the %s is missing", (_label, override) => {
    const client = { setVapidDetails: vi.fn() };
    const log = fakeLogger();

    const ok = configureWebPush(
      {
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub",
        VAPID_PRIVATE_KEY: "priv",
        VAPID_SUBJECT: "mailto:x@y.z",
        ...override,
      },
      client,
      log
    );

    expect(ok).toBe(false);
    expect(client.setVapidDetails).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      "VAPID keys not fully configured. Web push notifications will fail."
    );
  });

  it("uses the worker env, web-push client and notification logger by default", () => {
    expect(configureWebPush()).toBe(true);
    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      "mailto:ops@example.com",
      "pub",
      "priv"
    );
  });
});

describe("buildPushPayload", () => {
  it("keeps short messages intact", () => {
    expect(JSON.parse(buildPushPayload(notification))).toEqual({
      title: "Order ready",
      message: "Your order is ready",
      action_url: "/orders/1",
    });
  });

  it("keeps a message of exactly the max length intact", () => {
    const message = "x".repeat(PUSH_MESSAGE_MAX_LENGTH);

    expect(
      JSON.parse(buildPushPayload({ ...notification, message })).message
    ).toBe(message);
  });

  it("truncates long messages and appends an ellipsis", () => {
    const message = "x".repeat(PUSH_MESSAGE_MAX_LENGTH + 1);

    expect(
      JSON.parse(buildPushPayload({ ...notification, message })).message
    ).toBe("x".repeat(PUSH_MESSAGE_MAX_LENGTH) + "...");
  });
});

describe("sendPushToSubscription", () => {
  it("sends the payload to the subscription endpoint with its keys", async () => {
    const deps = makeDeps();

    await sendPushToSubscription(sub(1), "payload", deps);

    expect(deps.webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: sub(1).endpoint, keys: { p256dh: "p1", auth: "a1" } },
      "payload"
    );
  });

  it.each([404, 410])(
    "deletes the subscription when the push service answers %i",
    async (status) => {
      const deps = makeDeps();
      deps.webpush.sendNotification.mockRejectedValue(statusError(status));

      await expect(
        sendPushToSubscription(sub(1), "payload", deps)
      ).resolves.toBeUndefined();

      expect(deps.prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: sub(1).endpoint },
      });
      expect(deps.logger.info).toHaveBeenCalledWith(
        { endpoint: sub(1).endpoint },
        "Deleted stale push subscription"
      );
    }
  );

  it.each([
    ["a 500 status", statusError(500)],
    ["no status", new Error("network")],
  ])("rethrows push errors with %s", async (_label, error) => {
    const deps = makeDeps();
    deps.webpush.sendNotification.mockRejectedValue(error);

    await expect(sendPushToSubscription(sub(1), "payload", deps)).rejects.toBe(
      error
    );
    expect(deps.prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
  });
});

describe("sendPushToSubscriptions", () => {
  it("tallies fulfilled and rejected pushes", async () => {
    const deps = makeDeps();
    deps.webpush.sendNotification
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("x"))
      .mockResolvedValueOnce(undefined);

    const result = await sendPushToSubscriptions(
      [sub(1), sub(2), sub(3)],
      "payload",
      deps
    );

    expect(result).toEqual({ successCount: 2, failCount: 1 });
  });

  it("sends in chunks of the given size, one chunk at a time", async () => {
    const deps = makeDeps();
    const inFlight: number[] = [];
    let active = 0;
    deps.webpush.sendNotification.mockImplementation(async () => {
      active++;
      inFlight.push(active);
      await Promise.resolve();
      active--;
    });

    const result = await sendPushToSubscriptions(
      [sub(1), sub(2), sub(3), sub(4), sub(5)],
      "payload",
      deps,
      2
    );

    expect(result).toEqual({ successCount: 5, failCount: 0 });
    expect(Math.max(...inFlight)).toBe(2);
  });

  it("returns zero counts for no subscriptions", async () => {
    await expect(
      sendPushToSubscriptions([], "payload", makeDeps())
    ).resolves.toEqual({ successCount: 0, failCount: 0 });
  });
});

describe("processSendNotification", () => {
  it("creates the notification for the user and publishes it on the user channel", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);

    await processSendNotification(sendPayload, deps);

    expect(deps.prisma.notification.create).toHaveBeenCalledWith({
      data: { ...sendPayload.data, user: { connect: { id: "user-1" } } },
    });
    expect(deps.redisPublisher.publish).toHaveBeenCalledWith(
      "user:user-1:notifications",
      JSON.stringify(notification)
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      { userId: "user-1", notificationId: "notif-1" },
      "Notification sent to user"
    );
  });

  it("emails users who have an email address", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.user.findUnique.mockResolvedValue({
      email: "u@example.com",
      name: "Una",
    });
    deps.sendEmail.mockResolvedValue(true);

    await processSendNotification(sendPayload, deps);

    expect(deps.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true, name: true },
    });
    expect(deps.sendEmail).toHaveBeenCalledWith({
      to: "u@example.com",
      recipientName: "Una",
      title: "Order ready",
      message: "Your order is ready",
      actionUrl: "/orders/1",
    });
    expect(deps.logger.info).toHaveBeenCalledWith(
      { userId: "user-1", notificationId: "notif-1" },
      "Notification email sent"
    );
  });

  it("does not log an email as sent when the mailer is disabled", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.user.findUnique.mockResolvedValue({
      email: "u@x.y",
      name: null,
    });
    deps.sendEmail.mockResolvedValue(false);

    await processSendNotification(sendPayload, deps);

    expect(deps.logger.info).not.toHaveBeenCalledWith(
      expect.anything(),
      "Notification email sent"
    );
  });

  it.each([
    ["the user does not exist", null],
    ["the user has no email", { email: null, name: "N" }],
  ])("skips email when %s", async (_label, user) => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.user.findUnique.mockResolvedValue(user);

    await processSendNotification(sendPayload, deps);

    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it("logs email failures without failing the job or skipping push", async () => {
    const deps = makeDeps();
    const failure = new Error("smtp down");
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.user.findUnique.mockRejectedValue(failure);
    deps.prisma.pushSubscription.findMany.mockResolvedValue([sub(1)]);

    await processSendNotification(sendPayload, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(
      { err: failure, userId: "user-1", notificationId: "notif-1" },
      "Failed to send notification email"
    );
    expect(deps.webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it("pushes to every subscription of the user and logs success", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.pushSubscription.findMany.mockResolvedValue([sub(1), sub(2)]);

    await processSendNotification(sendPayload, deps);

    expect(deps.prisma.pushSubscription.findMany).toHaveBeenCalledWith({
      where: { user_id: "user-1" },
    });
    expect(deps.webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(deps.webpush.sendNotification).toHaveBeenCalledWith(
      expect.anything(),
      buildPushPayload(notification)
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      { successCount: 2, userId: "user-1" },
      "Web push notifications sent"
    );
  });

  it("warns when some pushes fail", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.pushSubscription.findMany.mockResolvedValue([sub(1), sub(2)]);
    deps.webpush.sendNotification
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(statusError(500));

    await processSendNotification(sendPayload, deps);

    expect(deps.logger.warn).toHaveBeenCalledWith(
      { failedCount: 1, userId: "user-1" },
      "Some push notifications failed"
    );
  });

  it("does not push when the user has no subscriptions", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);

    await processSendNotification(sendPayload, deps);

    expect(deps.webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("logs push lookup failures without failing the job", async () => {
    const deps = makeDeps();
    const failure = new Error("db");
    deps.prisma.notification.create.mockResolvedValue(notification);
    deps.prisma.pushSubscription.findMany.mockRejectedValue(failure);

    await processSendNotification(sendPayload, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(
      { err: failure, userId: "user-1", notificationId: "notif-1" },
      "Failed to send web push notifications"
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.anything(),
      "Notification sent to user"
    );
  });

  it("propagates failures to create the notification", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockRejectedValue(new Error("db"));

    await expect(processSendNotification(sendPayload, deps)).rejects.toThrow(
      "db"
    );
    expect(deps.redisPublisher.publish).not.toHaveBeenCalled();
  });
});

describe("processBroadcastNotification", () => {
  const broadcast = { ...notification, id: "bc-1", title: "Maintenance" };

  it("creates the broadcast and publishes it on the broadcast channel", async () => {
    const deps = makeDeps();
    deps.prisma.broadcastNotification.create.mockResolvedValue(broadcast);

    await processBroadcastNotification(broadcastPayload, deps);

    expect(deps.prisma.broadcastNotification.create).toHaveBeenCalledWith({
      data: broadcastPayload.data,
    });
    expect(deps.redisPublisher.publish).toHaveBeenCalledWith(
      "broadcast:notifications",
      JSON.stringify(broadcast)
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      { broadcastId: "bc-1", title: "Maintenance" },
      "Broadcast notification sent via SSE"
    );
  });

  it("pushes to every subscription in chunks and logs success", async () => {
    const deps = makeDeps();
    const subs = Array.from({ length: BROADCAST_PUSH_CHUNK_SIZE + 1 }, (_, i) =>
      sub(i)
    );
    deps.prisma.broadcastNotification.create.mockResolvedValue(broadcast);
    deps.prisma.pushSubscription.findMany.mockResolvedValue(subs);

    await processBroadcastNotification(broadcastPayload, deps);

    expect(deps.prisma.pushSubscription.findMany).toHaveBeenCalledWith({
      select: { endpoint: true, p256dh: true, auth: true },
    });
    expect(deps.webpush.sendNotification).toHaveBeenCalledTimes(subs.length);
    expect(deps.logger.info).toHaveBeenCalledWith(
      { successCount: subs.length, broadcastId: "bc-1" },
      "Broadcast web push notifications sent"
    );
  });

  it("warns with both counts when some pushes fail", async () => {
    const deps = makeDeps();
    deps.prisma.broadcastNotification.create.mockResolvedValue(broadcast);
    deps.prisma.pushSubscription.findMany.mockResolvedValue([sub(1), sub(2)]);
    deps.webpush.sendNotification
      .mockRejectedValueOnce(statusError(500))
      .mockResolvedValueOnce(undefined);

    await processBroadcastNotification(broadcastPayload, deps);

    expect(deps.logger.warn).toHaveBeenCalledWith(
      { failedCount: 1, successCount: 1, broadcastId: "bc-1" },
      "Some broadcast push notifications failed"
    );
  });

  it("does not push when nobody is subscribed", async () => {
    const deps = makeDeps();
    deps.prisma.broadcastNotification.create.mockResolvedValue(broadcast);

    await processBroadcastNotification(broadcastPayload, deps);

    expect(deps.webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("logs push lookup failures without failing the job", async () => {
    const deps = makeDeps();
    const failure = new Error("db");
    deps.prisma.broadcastNotification.create.mockResolvedValue(broadcast);
    deps.prisma.pushSubscription.findMany.mockRejectedValue(failure);

    await processBroadcastNotification(broadcastPayload, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(
      { err: failure, broadcastId: "bc-1" },
      "Failed to send broadcast web push notifications"
    );
  });
});

describe("processNotificationJob", () => {
  it("routes SEND_NOTIFICATION jobs to the user flow", async () => {
    const deps = makeDeps();
    deps.prisma.notification.create.mockResolvedValue(notification);

    await processNotificationJob(
      { id: "j1", data: { type: "SEND_NOTIFICATION", payload: sendPayload } },
      deps
    );

    expect(deps.prisma.notification.create).toHaveBeenCalled();
    expect(deps.prisma.broadcastNotification.create).not.toHaveBeenCalled();
  });

  it("routes BROADCAST_NOTIFICATION jobs to the broadcast flow", async () => {
    const deps = makeDeps();
    deps.prisma.broadcastNotification.create.mockResolvedValue(notification);

    await processNotificationJob(
      {
        id: "j2",
        data: { type: "BROADCAST_NOTIFICATION", payload: broadcastPayload },
      },
      deps
    );

    expect(deps.prisma.broadcastNotification.create).toHaveBeenCalled();
    expect(deps.prisma.notification.create).not.toHaveBeenCalled();
  });

  it.each([
    ["SEND_NOTIFICATION", broadcastPayload],
    ["BROADCAST_NOTIFICATION", sendPayload],
  ] as const)(
    "ignores %s jobs whose payload type does not match",
    async (type, payload) => {
      const deps = makeDeps();

      await processNotificationJob(
        { id: "j3", data: { type, payload } as NotificationJobData },
        deps
      );

      expect(deps.prisma.notification.create).not.toHaveBeenCalled();
      expect(deps.prisma.broadcastNotification.create).not.toHaveBeenCalled();
    }
  );

  it("logs and rethrows failures so BullMQ retries the job", async () => {
    const deps = makeDeps();
    const failure = new Error("db");
    deps.prisma.notification.create.mockRejectedValue(failure);

    await expect(
      processNotificationJob(
        { id: "j4", data: { type: "SEND_NOTIFICATION", payload: sendPayload } },
        deps
      )
    ).rejects.toBe(failure);
    expect(deps.logger.error).toHaveBeenCalledWith(
      { err: failure, jobId: "j4" },
      "Failed to process notification job"
    );
  });

  it("uses the shared prisma client by default", async () => {
    vi.mocked(prisma.broadcastNotification.create).mockResolvedValue(
      notification as never
    );
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

    await processNotificationJob({
      id: "j5",
      data: { type: "BROADCAST_NOTIFICATION", payload: broadcastPayload },
    });

    expect(prisma.broadcastNotification.create).toHaveBeenCalled();
  });
});

describe("handleNotificationJobFailed", () => {
  const job = (attemptsMade: number, attempts?: number) => ({
    id: "j1",
    data: { type: "SEND_NOTIFICATION", payload: sendPayload } as const,
    attemptsMade,
    opts: { attempts },
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves jobs that exhausted their attempts to the DLQ", async () => {
    const dlq = { add: vi.fn() };
    const log = fakeLogger();
    const err = new Error("boom");

    await handleNotificationJobFailed(job(3, 3), err, dlq, log);

    expect(log.error).toHaveBeenCalledWith(
      { err, jobId: "j1" },
      "Notification job failed"
    );
    expect(dlq.add).toHaveBeenCalledWith(
      "dead-notification",
      {
        originalJob: job(3, 3).data,
        error: "boom",
        failedAt: "2026-01-02T03:04:05.000Z",
        attempts: 3,
      },
      { removeOnComplete: false, removeOnFail: false }
    );
    expect(log.warn).toHaveBeenCalledWith({ jobId: "j1" }, "Job moved to DLQ");
  });

  it("treats a job without an attempts option as single-attempt", async () => {
    const dlq = { add: vi.fn() };

    await handleNotificationJobFailed(
      job(1),
      new Error("x"),
      dlq,
      fakeLogger()
    );

    expect(dlq.add).toHaveBeenCalledTimes(1);
  });

  it("does not dead-letter jobs that still have retries left", async () => {
    const dlq = { add: vi.fn() };

    await handleNotificationJobFailed(
      job(1, 3),
      new Error("x"),
      dlq,
      fakeLogger()
    );

    expect(dlq.add).not.toHaveBeenCalled();
  });

  it("only logs when BullMQ reports no job", async () => {
    const dlq = { add: vi.fn() };
    const log = fakeLogger();
    const err = new Error("x");

    await handleNotificationJobFailed(undefined, err, dlq, log);

    expect(log.error).toHaveBeenCalledWith(
      { err, jobId: undefined },
      "Notification job failed"
    );
    expect(dlq.add).not.toHaveBeenCalled();
  });

  it("logs when enqueueing to the DLQ fails", async () => {
    const failure = new Error("redis down");
    const dlq = { add: vi.fn().mockRejectedValue(failure) };
    const log = fakeLogger();

    await handleNotificationJobFailed(job(3, 3), new Error("x"), dlq, log);

    expect(log.error).toHaveBeenCalledWith(
      { err: failure, jobId: "j1" },
      "Failed to enqueue job to DLQ"
    );
    expect(log.warn).not.toHaveBeenCalled();
  });
});

describe("notificationWorker wiring", () => {
  const worker = notificationWorker as unknown as FakeWorker;
  const dlq = () => FakeQueue.byName("notification-dlq");

  it("consumes the notification queue with concurrency 5", () => {
    expect(worker.name).toBe(NOTIFICATION_QUEUE_NAME);
    expect(worker.opts).toEqual({
      connection: { host: "test-redis", port: 6379 },
      concurrency: 5,
    });
    expect(dlq().opts).toEqual({
      connection: { host: "test-redis", port: 6379 },
    });
  });

  it("delegates jobs to processNotificationJob", async () => {
    vi.mocked(prisma.notification.create).mockResolvedValue(
      notification as never
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

    await worker.processor(
      { id: "j1", data: { type: "SEND_NOTIFICATION", payload: sendPayload } },
      "token"
    );

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it("logs completed jobs", () => {
    worker.emit("completed", { id: "j2" });

    expect(loggers.notification.debug).toHaveBeenCalledWith(
      { jobId: "j2" },
      "Notification job completed"
    );
  });

  it("dead-letters exhausted jobs through the DLQ queue", async () => {
    await worker.emit(
      "failed",
      { id: "j3", data: {}, attemptsMade: 1, opts: {} },
      new Error("x")
    );

    expect(dlq().add).toHaveBeenCalledWith(
      "dead-notification",
      expect.objectContaining({ error: "x" }),
      expect.anything()
    );
  });

  it("closes the DLQ queue on shutdown", async () => {
    await closeNotificationDlqQueue();

    expect(dlq().close).toHaveBeenCalledTimes(1);
  });
  // Runs last: resetModules re-evaluates the module graph.
  it("configures web push at startup", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    await import("./consumer.js");

    expect(webpush.setVapidDetails).toHaveBeenCalledTimes(1);
  });
});
