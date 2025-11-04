import { loggers } from "@/lib/logger";
import notificationEmitter from "@/lib/notification-emitter";
import { authUtils } from "@/lib/utils/auth.utils.server";
export const runtime = "nodejs";
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
          loggers.notification.error(
            { err: error },
            "SSE message handler error"
          );
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
          loggers.notification.error(
            { err: error },
            "Failed to refresh SSE connection TTL"
          );
        }
      }, 15000);

      const connectedEventPayload = `event: connected\ndata: ${JSON.stringify({ message: "Connection established" })}\n\n`;
      controller.enqueue(encoder.encode(connectedEventPayload));
    },

    async cancel() {
      try {
        loggers.notification.info(
          { user_id },
          "Client disconnected. Cleaning up."
        );
      } catch {
        // Worker may have exited, ignore logging errors
      }
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
