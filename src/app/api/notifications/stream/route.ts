import { redisSubscriber } from "@/lib/redis";
import { authUtils } from "@/lib/utils-functions";

export async function GET() {
  const user_id = await authUtils.getUserId();
  const channels = [`user:${user_id}:notifications`, `broadcast:notifications`];

  const subscriber = redisSubscriber.duplicate();
  let heartbeatInterval: NodeJS.Timeout;
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder();

        const messageHandler = (channel: string, message: string) => {
          try {
            const notification = JSON.parse(message);
            const eventType = channel.startsWith("broadcast:")
              ? "new_broadcast"
              : "new_notification";

            const payload = {
              type: eventType,
              data: notification,
            };

            const sseData = `data: ${JSON.stringify(payload)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          } catch (error) {
            console.error("SSE message handler error:", error);
          }
        };
        heartbeatInterval = setInterval(() => {
          const heartbeat = ": heartbeat\n\n"; // SSE comment as heartbeat
          controller.enqueue(encoder.encode(heartbeat));
        }, 15000);

        await subscriber.subscribe(...channels);
        subscriber.on("message", messageHandler);
        const connectedEvent = {
          type: "connected",
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(connectedEvent)}\n\n`)
        );
      } catch (error) {
        console.log("Error in notification stream:", error);
        subscriber.quit();
        controller.close();
      }
    },
    async cancel() {
      console.log(
        `Client disconnected for user ${user_id}. Unsubscribing from Redis.`
      );
      clearInterval(heartbeatInterval);

      await subscriber.unsubscribe(...channels);

      subscriber.quit();
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
