import { createLogger } from "@/lib/logger";
import { redisPublisher } from "@/lib/redis";

const log = createLogger("batch-progress-publisher");

export interface BatchProgressPayload {
  batchId: string;
  shopId: string;
  status: string;
  collectiveTotal: number;
  minRequired: number | null;
}

export function batchProgressChannel(shopId: string): string {
  return `shop:${shopId}:batch-progress`;
}

export async function publishBatchProgress(
  payload: BatchProgressPayload
): Promise<void> {
  try {
    await redisPublisher.publish(
      batchProgressChannel(payload.shopId),
      JSON.stringify(payload)
    );
  } catch (error) {
    log.error({ err: error }, "Failed to publish batch progress update");
  }
}
