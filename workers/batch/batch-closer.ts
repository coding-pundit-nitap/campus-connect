import { Queue, Worker } from "bullmq";

import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redisConnection } from "../lib/redis-connection";
import {
  NOTIFICATION_QUEUE_NAME,
  NotificationJobData,
} from "../notification/types";

const logger = loggers.worker.child({ module: "batch-closer" });
const IDLE_THRESHOLD_MINUTES = 30;

export const BATCH_CLOSER_QUEUE_NAME = "batch-closer-queue";

const notificationQueue = new Queue<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 100,
    },
  }
);

export const batchCloserQueue = new Queue(BATCH_CLOSER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export async function closeBatchCloserQueues(): Promise<void> {
  await batchCloserQueue.close();
  await notificationQueue.close();
}

async function checkStaleBatches(): Promise<void> {
  const idleThreshold = new Date();
  idleThreshold.setMinutes(idleThreshold.getMinutes() - IDLE_THRESHOLD_MINUTES);

  const staleBatches = await prisma.batch.findMany({
    where: {
      status: "LOCKED",
      cutoff_time: { lt: idleThreshold },
      orders: { some: { order_status: "BATCHED" } },
    },
    select: {
      id: true,
      cutoff_time: true,
      shop: { select: { name: true, user: { select: { id: true } } } },
      orders: {
        where: { order_status: "BATCHED" },
        select: { id: true },
      },
    },
  });

  for (const batch of staleBatches) {
    if (batch.shop.user && batch.orders.length > 0) {
      const minutesLate = Math.round(
        (Date.now() - batch.cutoff_time.getTime()) / 60000
      );

      await notificationQueue.add(
        "vendor-idle-alert",
        {
          type: "SEND_NOTIFICATION",
          payload: {
            type: "SEND_NOTIFICATION",
            user_id: batch.shop.user.id,
            data: {
              title: "⚠️ Orders Waiting!",
              message: `You have ${batch.orders.length} orders waiting for ${minutesLate} mins! Start delivery NOW or they will be cancelled.`,
              type: "WARNING",
              category: "ORDER",
              action_url: `/owner-shops/dashboard`,
            },
          },
        },
        {
          jobId: `vendor-idle-alert:${batch.id}`,
          removeOnComplete: { age: 7200 }, // Clean up after 2 hours
          removeOnFail: { age: 86400 }, // Clean up after 24 hours
        }
      );

      logger.warn(
        `⚠️ Stale batch ${batch.id} for shop "${batch.shop.name}" - ${minutesLate} mins late`
      );
    }
  }
}

export async function runBatchCloserLogic(): Promise<void> {
  try {
    const now = new Date();

    const expiredBatches = await prisma.batch.findMany({
      where: {
        status: "OPEN",
        cutoff_time: { lt: now },
      },
      select: {
        id: true,
        shop_id: true,
        shop: {
          select: {
            name: true,
            user: { select: { id: true } },
          },
        },
        orders: {
          where: { order_status: "NEW" },
          select: { id: true },
        },
      },
    });

    if (expiredBatches.length > 0) {
      logger.info(
        `🔒 Found ${expiredBatches.length} expired batches. Locking them...`
      );

      const batchIds = expiredBatches.map((b) => b.id).sort();

      const { openBatchIds, countMap } = await prisma.$transaction(
        async (tx) => {
          const locked: { id: string; status: string }[] = await tx.$queryRaw`
          SELECT id, status FROM "Batch"
          WHERE id = ANY(${batchIds}::text[]) AND status = 'OPEN'
          ORDER BY id
          FOR UPDATE
        `;
          const openBatchIds = locked.map((b) => b.id);
          if (openBatchIds.length === 0) {
            return { openBatchIds: [], countMap: new Map<string, number>() };
          }

          // 1. Batch updates (status: "LOCKED")
          await tx.batch.updateMany({
            where: {
              id: { in: openBatchIds },
            },
            data: {
              status: "LOCKED",
            },
          });

          // 2 & 3. Transition orders to BATCHED and generate delivery OTPs
          await tx.$executeRaw`
          UPDATE "Order"
          SET order_status = 'BATCHED',
              delivery_otp = FLOOR(RANDOM() * 9000 + 1000)::text,
              updated_at = NOW()
          WHERE batch_id = ANY(${openBatchIds}::text[]) AND order_status = 'NEW'
        `;

          const orderCounts = await tx.order.groupBy({
            by: ["batch_id"],
            where: {
              batch_id: { in: openBatchIds },
              order_status: "BATCHED",
            },
            _count: { id: true },
          });
          const countMap = new Map(
            orderCounts.map((c) => [c.batch_id ?? "", c._count.id])
          );

          return { openBatchIds, countMap };
        }
      );

      if (openBatchIds.length > 0) {
        logger.info(`✅ Successfully LOCKED ${openBatchIds.length} batches.`);

        const processedBatches = expiredBatches.filter((b) =>
          openBatchIds.includes(b.id)
        );

        for (const batch of processedBatches) {
          const activeOrderCount = countMap.get(batch.id) ?? 0;
          logger.info(
            `--> Generated OTPs for ${activeOrderCount} orders in batch ${batch.id}`
          );

          if (batch.shop.user && activeOrderCount > 0) {
            try {
              await notificationQueue.add("batch-ready", {
                type: "SEND_NOTIFICATION",
                payload: {
                  type: "SEND_NOTIFICATION",
                  user_id: batch.shop.user.id,
                  data: {
                    title: "🚀 Batch Ready!",
                    message: `Batch for ${batch.shop.name} is ready with ${activeOrderCount} orders. Start preparing!`,
                    type: "SUCCESS",
                    category: "ORDER",
                    action_url: `/owner-shops/dashboard`,
                  },
                },
              });
              logger.info(
                `--> Notified Shop "${batch.shop.name}": Batch ${batch.id} is ready (${activeOrderCount} orders)`
              );
            } catch (notifError) {
              logger.error(
                { err: notifError, batchId: batch.id },
                "Failed to queue batch notification"
              );
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, "🔥 Error in Batch Closer locking logic");
  }

  try {
    await checkStaleBatches();
  } catch (error) {
    logger.error({ err: error }, "🔥 Error in stale batches check");
  }
}

export const batchCloserWorker = new Worker(
  BATCH_CLOSER_QUEUE_NAME,
  async (job) => {
    logger.info("Executing batch closer job...");
    await runBatchCloserLogic();
  },
  { connection: redisConnection }
);

batchCloserWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Batch closer job completed");
});

batchCloserWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Batch closer job failed");
});
