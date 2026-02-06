import { Queue } from "bullmq";
import cron from "node-cron";

import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redisConnection } from "../lib/redis-connection";
import {
  NOTIFICATION_QUEUE_NAME,
  NotificationJobData,
} from "../notification/types";

const logger = loggers.worker.child({ module: "batch-closer" });
const IDLE_THRESHOLD_MINUTES = 30;

const notificationQueue = new Queue<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: redisConnection,
  }
);

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generateOtpsForBatch(batchId: string): Promise<void> {
  const orders = await prisma.order.findMany({
    where: { batch_id: batchId },
    select: { id: true },
  });

  for (const order of orders) {
    const otp = generateOtp();
    await prisma.order.update({
      where: { id: order.id },
      data: { delivery_otp: otp },
    });
  }

  logger.info(
    `--> Generated OTPs for ${orders.length} orders in batch ${batchId}`
  );
}

async function checkStaleBatches(): Promise<void> {
  const idleThreshold = new Date();
  idleThreshold.setMinutes(idleThreshold.getMinutes() - IDLE_THRESHOLD_MINUTES);

  const staleBatches = await prisma.batch.findMany({
    where: {
      status: "LOCKED",
      cutoff_time: {
        lt: idleThreshold,
      },
    },
    select: {
      id: true,
      cutoff_time: true,
      shop: {
        select: {
          name: true,
          user: { select: { id: true } },
        },
      },
      _count: { select: { orders: true } },
    },
  });

  for (const batch of staleBatches) {
    if (batch.shop.user && batch._count.orders > 0) {
      const minutesLate = Math.round(
        (Date.now() - batch.cutoff_time.getTime()) / 60000
      );

      await notificationQueue.add("vendor-idle-alert", {
        type: "SEND_NOTIFICATION",
        payload: {
          type: "SEND_NOTIFICATION",
          user_id: batch.shop.user.id,
          data: {
            title: "⚠️ Orders Waiting!",
            message: `You have ${batch._count.orders} orders waiting for ${minutesLate} mins! Start delivery NOW or they will be cancelled.`,
            type: "WARNING",
            category: "ORDER",
            action_url: `/owner-shops/dashboard`,
          },
        },
      });

      logger.warn(
        `⚠️ Stale batch ${batch.id} for shop "${batch.shop.name}" - ${minutesLate} mins late`
      );
    }
  }
}

export const startBatchCloser = () => {
  logger.info("⏰ Batch Closer Worker Started...");

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const expiredBatches = await prisma.batch.findMany({
        where: {
          status: "OPEN",
          cutoff_time: {
            lt: now,
          },
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
          _count: { select: { orders: true } },
        },
      });

      if (expiredBatches.length > 0) {
        logger.info(
          `🔒 Found ${expiredBatches.length} expired batches. Locking them...`
        );

        const { count } = await prisma.batch.updateMany({
          where: {
            status: "OPEN",
            cutoff_time: {
              lt: now,
            },
          },
          data: {
            status: "LOCKED",
          },
        });

        await prisma.order.updateMany({
          where: { batch_id: { in: expiredBatches.map((b) => b.id) } },
          data: { order_status: "BATCHED" },
        });

        if (count > 0) {
          logger.info(`✅ Successfully LOCKED ${count} batches.`);

          for (const batch of expiredBatches) {
            await generateOtpsForBatch(batch.id);

            if (batch.shop.user && batch._count.orders > 0) {
              try {
                await notificationQueue.add("batch-ready", {
                  type: "SEND_NOTIFICATION",
                  payload: {
                    type: "SEND_NOTIFICATION",
                    user_id: batch.shop.user.id,
                    data: {
                      title: "🚀 Batch Ready!",
                      message: `Batch for ${batch.shop.name} is ready with ${batch._count.orders} orders. Start preparing!`,
                      type: "SUCCESS",
                      category: "ORDER",
                      action_url: `/owner-shops/dashboard`,
                    },
                  },
                });
                logger.info(
                  `--> Notified Shop "${batch.shop.name}": Batch ${batch.id} is ready (${batch._count.orders} orders)`
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

      await checkStaleBatches();
    } catch (error) {
      logger.error({ err: error }, "🔥 Error in Batch Closer");
    }
  });
};
