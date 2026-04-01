import { NextRequest } from "next/server";

import {
  MAX_SSE_CONNECTIONS_PER_USER,
  SSE_CONNECTION_TTL,
  SSE_HEARTBEAT_INTERVAL,
} from "@/config/constants";
import { BroadcastNotification, Notification } from "@/generated/client";
import notificationEmitter from "@/lib/notification-emitter";
import { prisma } from "@/lib/prisma";
import { redisSSE } from "@/lib/redis";
import { trackConnectionAtomic } from "@/lib/redis-script";
import { authUtils } from "@/lib/utils/auth.utils.server";

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
  const allowed = await trackConnectionAtomic(
    user_id,
    connectionId,
    MAX_SSE_CONNECTIONS_PER_USER,
    SSE_CONNECTION_TTL
  );

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

  if (lastEventId) {
    missedNotifications = await prisma.$transaction(async (prisma) => {
      const since = lastEventId;
      const userNotifications = await prisma.notification.findMany({
        where: {
          user_id,
          id: { gt: since },
          created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { created_at: "asc" },
      });

      const broadcastNotifications =
        await prisma.broadcastNotification.findMany({
          where: {
            id: { gt: since },
            created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { created_at: "asc" },
        });
      return [...userNotifications, ...broadcastNotifications].sort(
        (a, b) => a.created_at.getTime() - b.created_at.getTime()
      );
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ message: "Connection established" })}\n\n`
        )
      );

      for (const notification of missedNotifications) {
        const sseData = `id: ${notification.id}\nevent: new_notification\ndata: ${JSON.stringify(notification)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
      }

      const messageHandler = (channel: string, message: string) => {
        try {
          const notification = JSON.parse(message);
          const eventType = channel.startsWith("broadcast:")
            ? "new_broadcast"
            : "new_notification";

          const sseData = `id: ${notification.id}\nevent: ${eventType}\ndata: ${JSON.stringify(notification)}\n\n`;

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
          const key = `sse:connections:${user_id}`;
          await redisSSE.zadd(key, Date.now(), connectionId);
        } catch (error) {
          console.error("Failed to refresh SSE connection TTL", error);
          controller.close();
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
