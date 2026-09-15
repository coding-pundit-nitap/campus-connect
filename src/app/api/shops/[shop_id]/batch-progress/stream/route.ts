import { NextRequest } from "next/server";

import { batchProgressChannel } from "@/lib/batch-progress-publisher";
import { createLogger } from "@/lib/logger";
import notificationEmitter from "@/lib/notification-emitter";

const log = createLogger("route");

export const runtime = "nodejs";

const HEARTBEAT_INTERVAL_MS = 15_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  const { shop_id } = await params;
  const channel = batchProgressChannel(shop_id);

  let heartbeatInterval: NodeJS.Timeout | undefined;
  let handler: ((message: string) => void) | undefined;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (handler) notificationEmitter.unsubscribe(channel, handler);
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Ignore if already closed/cancelled
        }
      });

      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ shop_id })}\n\n`
        )
      );

      handler = (message: string) => {
        try {
          const sseData = `event: batch_progress\ndata: ${message}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          log.error({ err: error }, "batch-progress SSE handler error:");
        }
      };
      notificationEmitter.subscribe(channel, handler);

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
            )
          );
        } catch (error) {
          log.error({ err: error }, "Failed to send batch-progress heartbeat");
          cleanup();
          try {
            controller.close();
          } catch {
            // Ignore if already closed/cancelled
          }
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    async cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control":
        "private, no-cache, no-store, must-revalidate, max-age=0, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
