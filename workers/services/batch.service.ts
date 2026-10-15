import { BatchSlot, BatchStatus, Prisma } from "../generated/client/index.js";
import { publishBatchProgress } from "../lib/batch-progress-publisher.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import {
  createRedisReminderGate,
  type ReminderGate,
} from "../lib/reminder-gate.js";
import { getShopOrderUrl } from "../lib/url.utils.js";
import { NotificationService } from "./notification.service.js";
const log = loggers.batch;

/** Rupee amount for user-facing copy: whole rupees, or paise when present. */
export function formatRupees(amount: number): string {
  const cents = Math.round(amount * 100);
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

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
    private readonly prismaClient: typeof prisma = prisma,
    private readonly reminderGate: ReminderGate = createRedisReminderGate()
  ) {}
  /**
   * Cutoff for every expired OPEN batch: a batch whose snapshot is null, or
   * whose collective_total has reached it, is LOCKED and its NEW orders
   * BATCHED; one below its snapshot goes to PENDING_REVIEW with its orders
   * untouched, and the owner is told the shortfall. Then warns owners about
   * LOCKED batches left idle past the threshold.
   */
  async autoCloseExpiredBatches(): Promise<void> {
    await this.closeExpiredBatches();
    await this.remindStaleBatches();
  }

  private async closeExpiredBatches(): Promise<void> {
    const expiredBatches = await this.prismaClient.batch.findMany({
      where: { status: "OPEN", cutoff_time: { lt: new Date() } },
      select: {
        id: true,
        shop_id: true,
        shop: { select: { name: true, user: { select: { id: true } } } },
        orders: { where: { order_status: "NEW" }, select: { id: true } },
      },
    });

    if (expiredBatches.length === 0) {
      return;
    }
    log.info(`🔒 Found ${expiredBatches.length} expired batches. Closing...`);

    const outcomes = await this.prismaClient.$transaction(
      async (
        tx: Omit<
          typeof prisma,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
        >
      ) => {
        const ids = expiredBatches.map((b: { id: string }) => b.id).sort();
        const rows: {
          id: string;
          collective_total: string;
          min_order_value_snapshot: string | null;
        }[] = await tx.$queryRaw`
          SELECT id, collective_total, min_order_value_snapshot FROM "Batch"
          WHERE id IN (${Prisma.join(ids)}) AND status = 'OPEN'
          ORDER BY id
          FOR UPDATE
        `;

        const results = rows.map((row) => {
          const collectiveTotal = Number(row.collective_total);
          const minRequired =
            row.min_order_value_snapshot === null
              ? null
              : Number(row.min_order_value_snapshot);
          const status: BatchStatus =
            minRequired !== null && collectiveTotal < minRequired
              ? "PENDING_REVIEW"
              : "LOCKED";
          return { id: row.id, status, collectiveTotal, minRequired };
        });

        const idsWith = (status: BatchStatus) =>
          results.filter((r) => r.status === status).map((r) => r.id);
        const pendingIds = idsWith("PENDING_REVIEW");
        const lockedIds = idsWith("LOCKED");

        if (pendingIds.length > 0) {
          await tx.batch.updateMany({
            where: { id: { in: pendingIds } },
            data: { status: "PENDING_REVIEW" },
          });
        }
        if (lockedIds.length > 0) {
          await tx.batch.updateMany({
            where: { id: { in: lockedIds } },
            data: { status: "LOCKED" },
          });
          await tx.$executeRaw`
            UPDATE "Order"
            SET order_status = 'BATCHED',
                delivery_otp = FLOOR(RANDOM() * 9000 + 1000)::text,
                updated_at = NOW()
            WHERE batch_id = ANY(${lockedIds}::text[]) AND order_status = 'NEW'
          `;
        }
        return results;
      }
    );

    for (const outcome of outcomes) {
      const batch = expiredBatches.find(
        (b: { id: string }) => b.id === outcome.id
      )!;
      await publishBatchProgress({
        batchId: outcome.id,
        shopId: batch.shop_id,
        status: outcome.status,
        collectiveTotal: outcome.collectiveTotal,
        minRequired: outcome.minRequired,
      });

      const ownerId = batch.shop.user?.id;
      const orderCount = batch.orders.length;
      if (!ownerId || (outcome.status === "LOCKED" && orderCount === 0)) {
        continue;
      }
      const notification =
        outcome.status === "LOCKED"
          ? {
              title: "🚀 Batch Ready!",
              message: `Batch for ${batch.shop.name} is ready with ${orderCount} orders. Start preparing!`,
              type: "SUCCESS" as const,
            }
          : {
              title: "⚠️ Batch Below Minimum",
              message: `Batch for ${batch.shop.name} is ₹${formatRupees(
                outcome.minRequired! - outcome.collectiveTotal
              )} short of its collective minimum. Decide whether to proceed or cancel.`,
              type: "WARNING" as const,
            };
      try {
        await this.notificationService.publishNotification(ownerId, {
          ...notification,
          category: "ORDER",
          action_url: batch.orders[0]
            ? getShopOrderUrl(batch.orders[0].id)
            : "/owner-shops",
        });
      } catch (notifError) {
        log.error(
          { err: notifError, batchId: batch.id },
          "Failed to publish cutoff notification"
        );
      }
    }
  }

  private async remindStaleBatches(): Promise<void> {
    const IDLE_THRESHOLD_MINUTES = 30;
    // The scheduler ticks every minute; remind the owner once per interval
    // per batch instead of on every tick.
    const STALE_REMINDER_INTERVAL_SECONDS = 30 * 60;
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
      // The query only returns batches with at least one BATCHED order.
      if (batch.shop.user) {
        const minutesLate = Math.round(
          (Date.now() - batch.cutoff_time.getTime()) / 60000
        );

        try {
          const due = await this.reminderGate
            .tryAcquire(
              `stale-batch:${batch.id}`,
              STALE_REMINDER_INTERVAL_SECONDS
            )
            .catch((gateError: unknown) => {
              // Fail open: a missed dedupe is better than a missed warning.
              log.warn(
                { err: gateError, batchId: batch.id },
                "Reminder gate unavailable; sending stale notification"
              );
              return true;
            });
          if (!due) continue;

          await this.notificationService.publishNotification(
            batch.shop.user.id,
            {
              title: "⚠️ Orders Waiting!",
              message: `You have ${batch.orders.length} orders waiting for ${minutesLate} mins! Start delivery NOW or they will be cancelled.`,
              type: "WARNING",
              category: "ORDER",
              action_url: getShopOrderUrl(batch.orders[0].id),
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
