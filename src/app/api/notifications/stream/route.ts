import notificationEmitter, {
  subscribeToChannel,
} from "@/lib/notification-emitter";
import { authUtils } from "@/lib/utils-functions";

export async function GET() {
  const user_id = await authUtils.getUserId();
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
        subscribeToChannel(channel);
        const handler = (message: string) => messageHandler(channel, message);
        listeners.push({ channel, handler });
        notificationEmitter.on(channel, handler);
      });

      heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      const connectedEventPayload = `event: connected\ndata: ${JSON.stringify({ message: "Connection established" })}\n\n`;
      controller.enqueue(encoder.encode(connectedEventPayload));
    },

    cancel() {
      console.log(`Client disconnected for user ${user_id}. Cleaning up.`);
      clearInterval(heartbeatInterval);

      listeners.forEach(({ channel, handler }) => {
        notificationEmitter.removeListener(channel, handler);
      });
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
