import { BatchSlot, BatchStatus, Prisma } from "../generated/client";
import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { NotificationService } from "./notification.service";
const log = loggers.batch;

export interface BatchSummaryItem {
  product_id: string;
  name: string;
  quantity: number;
}

export interface BatchInfo {
  id: string;
  status: BatchStatus;
  cutoff_time: Date;
  order_count: number;
  total_earnings: number;
  item_summary?: BatchSummaryItem[];
  orders?: {
    id: string;
    display_id: string;
    status: string;
    phone?: string | null;
    delivery_address?: {
      hostel_block: string | null;
      label: string;
      building: string;
      room_number: string;
    } | null;
  }[];
}

export interface DirectOrderInfo {
  id: string;
  display_id: string;
  status: string;
  phone?: string | null;
  item_total: number;
  delivery_fee: number;
  platform_fee: number;
  total_earnings: number;
  created_at: Date;
  delivery_address?: {
    hostel_block: string | null;
    label: string;
    building: string;
    room_number: string;
  } | null;
}

export interface BatchSlotWithAvailability extends BatchSlot {
  is_today_available: boolean;
}

export class BatchService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prismaClient: typeof prisma = prisma
  ) {}
  async autoCloseExpiredBatches(): Promise<void> {
    const now = new Date();

    const expiredBatches = await this.prismaClient.batch.findMany({
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
      log.info(`🔒 Found ${expiredBatches.length} expired batches. Locking...`);

      const batchIds = expiredBatches.map((b) => b.id).sort();

      const { openBatchIds, countMap } = await this.prismaClient.$transaction(
        async (tx) => {
          const locked: { id: string; status: string }[] = await tx.$queryRaw`
            SELECT id, status FROM "Batch"
            WHERE id IN (${Prisma.join(batchIds)}) AND status = 'OPEN'
            ORDER BY id
            FOR UPDATE
          `;
          const openBatchIds = locked.map((b) => b.id);
          if (openBatchIds.length === 0) {
            return { openBatchIds: [], countMap: new Map<string, number>() };
          }

          await tx.batch.updateMany({
            where: { id: { in: openBatchIds } },
            data: { status: "LOCKED" },
          });

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
        log.info(`✅ Successfully LOCKED ${openBatchIds.length} batches.`);

        const processedBatches = expiredBatches.filter((b) =>
          openBatchIds.includes(b.id)
        );

        for (const batch of processedBatches) {
          const activeOrderCount = countMap.get(batch.id) ?? 0;
          if (batch.shop.user && activeOrderCount > 0) {
            try {
              await this.notificationService.publishNotification(
                batch.shop.user.id,
                {
                  title: "🚀 Batch Ready!",
                  message: `Batch for ${batch.shop.name} is ready with ${activeOrderCount} orders. Start preparing!`,
                  type: "SUCCESS",
                  category: "ORDER",
                  action_url: `/owner-shops/dashboard`,
                }
              );
            } catch (notifError) {
              log.error(
                { err: notifError, batchId: batch.id },
                "Failed to publish batch notification"
              );
            }
          }
        }
      }
    }

    const IDLE_THRESHOLD_MINUTES = 30;
    const idleThreshold = new Date();
    idleThreshold.setMinutes(
      idleThreshold.getMinutes() - IDLE_THRESHOLD_MINUTES
    );

    const staleBatches = await this.prismaClient.batch.findMany({
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

        try {
          await this.notificationService.publishNotification(
            batch.shop.user.id,
            {
              title: "⚠️ Orders Waiting!",
              message: `You have ${batch.orders.length} orders waiting for ${minutesLate} mins! Start delivery NOW or they will be cancelled.`,
              type: "WARNING",
              category: "ORDER",
              action_url: `/owner-shops/dashboard`,
            }
          );
        } catch (notifError) {
          log.error(
            { err: notifError, batchId: batch.id },
            "Failed to publish stale notification"
          );
        }
      }
    }
  }
}
