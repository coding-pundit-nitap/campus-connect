import { NextRequest } from "next/server";

import {
  MAX_SSE_CONNECTIONS_PER_USER,
  SSE_CONNECTION_TTL,
  SSE_HEARTBEAT_INTERVAL,
  SSE_REPLAY_BROADCAST_LIMIT,
  SSE_REPLAY_USER_LIMIT,
} from "@/config/constants";
import { BroadcastNotification, Notification } from "@/generated/client";
import notificationEmitter from "@/lib/notification-emitter";
import { prisma } from "@/lib/prisma";
import { redisSSE } from "@/lib/redis";
import {
  refreshConnectionHeartbeatAtomic,
  trackConnectionAtomic,
} from "@/lib/redis-script";
import { authUtils } from "@/lib/utils/auth.utils.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPLAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type NotificationCursor = {
  createdAt: Date;
  id: string;
};

type NotificationStreamItem = {
  id: string;
  created_at: Date | string;
};

function createCursorId(createdAt: Date | string, id: string): string {
  const createdAtMs = new Date(createdAt).getTime();

  if (Number.isNaN(createdAtMs)) {
    return `${Date.now()}:${id}`;
  }

  return `${createdAtMs}:${id}`;
}

function parseCursorId(cursorId: string | null): NotificationCursor | null {
  if (!cursorId) {
    return null;
  }

  const separatorIndex = cursorId.indexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const timestamp = Number(cursorId.slice(0, separatorIndex));
  const id = cursorId.slice(separatorIndex + 1);
  const createdAt = new Date(timestamp);

  if (!Number.isFinite(timestamp) || !id || Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return { createdAt, id };
}

async function resolveReplayCursor(
  cursorId: string | null
): Promise<NotificationCursor | null> {
  const parsed = parseCursorId(cursorId);
  if (parsed) {
    return parsed;
  }

  if (!cursorId) {
    return null;
  }

  const [notification, broadcastNotification] = await prisma.$transaction([
    prisma.notification.findUnique({
      where: { id: cursorId },
      select: { id: true, created_at: true },
    }),
    prisma.broadcastNotification.findUnique({
      where: { id: cursorId },
      select: { id: true, created_at: true },
    }),
  ]);

  const resolvedCursor = notification ?? broadcastNotification;
  if (!resolvedCursor) {
    return null;
  }

  return {
    createdAt: resolvedCursor.created_at,
    id: resolvedCursor.id,
  };
}

function compareNotificationsByCursor(
  a: Notification | BroadcastNotification,
  b: Notification | BroadcastNotification
): number {
  const timeDiff = a.created_at.getTime() - b.created_at.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return a.id.localeCompare(b.id);
}

async function untrackConnection(
  userId: string,
  connectionId: string
): Promise<void> {
  try {
    const key = `sse:connections:${userId}`;
    await redisSSE.zrem(key, connectionId);
  } catch (error) {
    console.error("Failed to untrack SSE connection:", error);
  }
}

export async function GET(req: NextRequest) {
  const user_id = await authUtils.getUserId();
  const lastEventId =
    req.headers.get("last-event-id") ??
    req.nextUrl.searchParams.get("lastEventId");

  const connectionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let allowed = true;
  try {
    allowed = await trackConnectionAtomic(
      user_id,
      connectionId,
      MAX_SSE_CONNECTIONS_PER_USER,
      SSE_CONNECTION_TTL
    );
  } catch (error) {
    console.error("Failed to track SSE connection:", error);
    allowed = true;
  }

  if (!allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Too many active connections. Maximum ${MAX_SSE_CONNECTIONS_PER_USER} connections allowed per user.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }

  const channels = [`user:${user_id}:notifications`, `broadcast:notifications`];

  let heartbeatInterval: NodeJS.Timeout;
  const listeners: { channel: string; handler: (message: string) => void }[] =
    [];

  let missedNotifications: (Notification | BroadcastNotification)[] = [];
  let replayTruncated = false;
  let shouldRefetchOnConnect = false;
  const replayCursor = await resolveReplayCursor(lastEventId);
  const replayWindowStart = new Date(Date.now() - REPLAY_WINDOW_MS);

  if (lastEventId && !replayCursor) {
    shouldRefetchOnConnect = true;
  }

  if (lastEventId && replayCursor) {
    const replay = await prisma.$transaction(async (tx) => {
      const userNotifications = await tx.notification.findMany({
        where: {
          user_id,
          created_at: { gt: replayWindowStart },
          OR: [
            { created_at: { gt: replayCursor.createdAt } },
            {
              AND: [
                { created_at: replayCursor.createdAt },
                { id: { gt: replayCursor.id } },
              ],
            },
          ],
        },
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
        take: SSE_REPLAY_USER_LIMIT + 1,
      });

      const broadcastNotifications = await tx.broadcastNotification.findMany({
        where: {
          created_at: { gt: replayWindowStart },
          OR: [
            { created_at: { gt: replayCursor.createdAt } },
            {
              AND: [
                { created_at: replayCursor.createdAt },
                { id: { gt: replayCursor.id } },
              ],
            },
          ],
        },
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
        take: SSE_REPLAY_BROADCAST_LIMIT + 1,
      });

      const userReplayTruncated =
        userNotifications.length > SSE_REPLAY_USER_LIMIT;
      const broadcastReplayTruncated =
        broadcastNotifications.length > SSE_REPLAY_BROADCAST_LIMIT;

      return {
        notifications: [
          ...userNotifications.slice(0, SSE_REPLAY_USER_LIMIT),
          ...broadcastNotifications.slice(0, SSE_REPLAY_BROADCAST_LIMIT),
        ].sort(compareNotificationsByCursor),
        replayTruncated: userReplayTruncated || broadcastReplayTruncated,
      };
    });

    missedNotifications = replay.notifications;
    replayTruncated = replay.replayTruncated;
    shouldRefetchOnConnect = shouldRefetchOnConnect || replay.replayTruncated;
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            message: "Connection established",
            heartbeatIntervalMs: SSE_HEARTBEAT_INTERVAL,
            replay: {
              truncated: replayTruncated,
              shouldRefetch: shouldRefetchOnConnect,
            },
          })}\n\n`
        )
      );

      for (const notification of missedNotifications) {
        const eventType =
          "user_id" in notification ? "new_notification" : "new_broadcast";
        const sseData = `id: ${createCursorId(notification.created_at, notification.id)}\nevent: ${eventType}\ndata: ${JSON.stringify(notification)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
      }

      const messageHandler = (channel: string, message: string) => {
        try {
          const notification: NotificationStreamItem & Record<string, unknown> =
            JSON.parse(message);
          const eventType = channel.startsWith("broadcast:")
            ? "new_broadcast"
            : "new_notification";

          const sseData = `id: ${createCursorId(notification.created_at, notification.id)}\nevent: ${eventType}\ndata: ${JSON.stringify(notification)}\n\n`;

          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          console.error("SSE message handler error:", error);
        }
      };

      channels.forEach((channel) => {
        const handler = (message: string) => messageHandler(channel, message);
        listeners.push({ channel, handler });
        notificationEmitter.subscribe(channel, handler);
      });

      heartbeatInterval = setInterval(async () => {
        try {
          const pingData = `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(pingData));
          await refreshConnectionHeartbeatAtomic(
            user_id,
            connectionId,
            SSE_CONNECTION_TTL
          );
        } catch (error) {
          console.error("Failed to refresh SSE connection TTL", error);
          controller.close();
          clearInterval(heartbeatInterval);
          listeners.forEach(({ channel, handler }) => {
            notificationEmitter.unsubscribe(channel, handler);
          });
        }
      }, SSE_HEARTBEAT_INTERVAL);
    },

    async cancel() {
      clearInterval(heartbeatInterval);

      listeners.forEach(({ channel, handler }) => {
        notificationEmitter.unsubscribe(channel, handler);
      });

      try {
        await untrackConnection(user_id, connectionId);
      } catch {
        // Worker may have exited, ignore cleanup errors
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
