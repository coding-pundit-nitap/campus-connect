import {
  MAX_SSE_CONNECTIONS_PER_USER,
  SSE_CONNECTION_TTL,
  SSE_HEARTBEAT_INTERVAL,
} from "@/config/constants";
import notificationEmitter from "@/lib/notification-emitter";
import { redisPublisher } from "@/lib/redis";
import { authUtils } from "@/lib/utils/auth.utils.server";

async function trackConnection(userId: string): Promise<{
  allowed: boolean;
  connectionId: string;
}> {
  const connectionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const key = `sse:connections:${userId}`;

  try {
    await redisPublisher.zadd(key, Date.now(), connectionId);

    const staleThreshold = Date.now() - SSE_CONNECTION_TTL * 1000;
    await redisPublisher.zremrangebyscore(key, 0, staleThreshold);

    const count = await redisPublisher.zcard(key);

    if (count > MAX_SSE_CONNECTIONS_PER_USER) {
      await redisPublisher.zrem(key, connectionId);
      return { allowed: false, connectionId };
    }
    await redisPublisher.expire(key, SSE_CONNECTION_TTL);

    return { allowed: true, connectionId };
  } catch (error) {
    console.error("Failed to track SSE connection:", error);
    return { allowed: true, connectionId };
  }
}

async function untrackConnection(
  userId: string,
  connectionId: string
): Promise<void> {
  try {
    const key = `sse:connections:${userId}`;
    await redisPublisher.zrem(key, connectionId);
  } catch (error) {
    console.error("Failed to untrack SSE connection:", error);
  }
}

export async function GET() {
  const user_id = await authUtils.getUserId();

  const { allowed, connectionId } = await trackConnection(user_id);

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

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const messageHandler = (channel: string, message: string) => {
        try {
          const notification = JSON.parse(message);
          const eventType = channel.startsWith("broadcast:")
            ? "new_broadcast"
            : "new_notification";

          const sseData = `event: ${eventType}\ndata: ${JSON.stringify(notification)}\n\n`;

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
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
        try {
          const key = `sse:connections:${user_id}`;
          await redisPublisher.zadd(key, Date.now(), connectionId);
        } catch (error) {
          console.error("Failed to refresh SSE connection TTL", error);
        }
      }, SSE_HEARTBEAT_INTERVAL);

      const connectedEventPayload = `event: connected\ndata: ${JSON.stringify({ message: "Connection established" })}\n\n`;
      controller.enqueue(encoder.encode(connectedEventPayload));
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
