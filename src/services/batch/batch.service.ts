import { randomInt } from "node:crypto";

import { BatchSlot, BatchStatus } from "@/generated/client";
import { NotFoundError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  addZonedDays,
  APP_TIME_ZONE,
  getZonedParts,
  zonedPartsToUtcDate,
} from "@/lib/utils/timezone";
import { BatchRepository } from "@/repositories/batch.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { ShopRepository } from "@/repositories/shop.repository";
import { NotificationService } from "@/services/notification/notification.service";
const log = createLogger("batch.service");

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
    private readonly batchRepository: BatchRepository,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly shopRepository: ShopRepository,
    private readonly notificationService: NotificationService,
    private readonly prismaClient: typeof prisma = prisma
  ) {}
  async getBatchSlotsWithAvailability(
    shopId: string
  ): Promise<BatchSlotWithAvailability[]> {
    await this.autoLockExpiredBatches(shopId);

    const allSlots = await this.batchRepository.findActiveSlots(shopId);

    const now = new Date();
    const nowZoned = getZonedParts(now, APP_TIME_ZONE);
    const todayStart = zonedPartsToUtcDate(
      { ...nowZoned, hour: 0, minute: 0, second: 0 },
      APP_TIME_ZONE
    );
    const todayEnd = zonedPartsToUtcDate(
      { ...nowZoned, hour: 23, minute: 59, second: 59 },
      APP_TIME_ZONE
    );

    const todayBatches = await this.batchRepository.findBatchesByTimeRange(
      shopId,
      todayStart,
      todayEnd
    );

    return allSlots.map((slot) => {
      const slotCutoffToday = zonedPartsToUtcDate(
        {
          ...nowZoned,
          hour: Math.floor(slot.cutoff_time_minutes / 60),
          minute: slot.cutoff_time_minutes % 60,
          second: 0,
        },
        APP_TIME_ZONE
      );

      const existingBatch = todayBatches.find(
        (b) =>
          Math.abs(b.cutoff_time.getTime() - slotCutoffToday.getTime()) < 1000
      );

      let is_today_available = true;
      if (existingBatch && existingBatch.status !== "OPEN") {
        is_today_available = false;
      }

      return { ...slot, is_today_available };
    });
  }

  private async getActiveSlots(
    shopId: string
  ): Promise<
    { id: string; cutoff_time_minutes: number; sort_order: number }[]
  > {
    return this.batchRepository.findActiveSlots(shopId, {
      select: { id: true, cutoff_time_minutes: true, sort_order: true },
    });
  }

  private async computeNextCutoffFromSlots(
    shopId: string,
    now: Date,
    slots: { id: string; cutoff_time_minutes: number }[]
  ): Promise<Date> {
    const nowZoned = getZonedParts(now, APP_TIME_ZONE);
    const sortedSlots = [...slots].sort(
      (a, b) => a.cutoff_time_minutes - b.cutoff_time_minutes
    );

    const daysOffset = [0, 1, 2];

    for (const offset of daysOffset) {
      const baseDate =
        offset === 0
          ? { year: nowZoned.year, month: nowZoned.month, day: nowZoned.day }
          : addZonedDays(
              { year: nowZoned.year, month: nowZoned.month, day: nowZoned.day },
              offset,
              APP_TIME_ZONE
            );

      for (const slot of sortedSlots) {
        const hour = Math.floor(slot.cutoff_time_minutes / 60);
        const minute = slot.cutoff_time_minutes % 60;
        const candidateTime = zonedPartsToUtcDate(
          { ...baseDate, hour, minute, second: 0 },
          APP_TIME_ZONE
        );

        if (candidateTime.getTime() <= now.getTime()) {
          continue;
        }

        const existingBatch = await this.batchRepository.findFirst({
          where: {
            shop_id: shopId,
            cutoff_time: candidateTime,
          },
          select: { id: true, status: true },
        });

        if (!existingBatch) {
          return candidateTime;
        }

        if (existingBatch.status === "OPEN") {
          return candidateTime;
        }
      }
    }

    const hour = Math.floor(sortedSlots[0].cutoff_time_minutes / 60);
    const minute = sortedSlots[0].cutoff_time_minutes % 60;
    const tomorrowDate = addZonedDays(
      { year: nowZoned.year, month: nowZoned.month, day: nowZoned.day },
      1,
      APP_TIME_ZONE
    );
    return zonedPartsToUtcDate(
      { ...tomorrowDate, hour, minute, second: 0 },
      APP_TIME_ZONE
    );
  }

  async lockBatch(batchId: string, shopId: string): Promise<void> {
    const batch = await this.batchRepository.findById(batchId, {
      select: { id: true, shop_id: true, status: true, cutoff_time: true },
    });

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.shop_id !== shopId) {
      throw new Error("Unauthorized: Batch does not belong to your shop");
    }

    if (batch.status !== "OPEN") {
      throw new Error("Only OPEN batches can be locked");
    }

    await this.batchRepository.updateStatus(batchId, "LOCKED");

    const orders = await this.orderRepository.getOrdersByIds([], {
      where: { batch_id: batchId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await this.orderRepository.batchUpdateStatus(orderIds, "BATCHED");
    }

    await this.generateOtpForBatch(batchId);
  }

  async getBatchSummary(batchId: string): Promise<BatchSummaryItem[]> {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    const items = await this.batchRepository.getOrderItemSummary(batchId);

    const productIds = items.map((i) => i.product_id);
    const products = await this.productRepository.findManyByShopId("", {
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const summary = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        name: product?.name || "Unknown Item",
        quantity: item._sum.quantity || 0,
      };
    });

    return summary;
  }

  async autoLockExpiredBatches(shopId: string): Promise<void> {
    const now = new Date();
    const expiredBatches = await this.batchRepository.findMany({
      where: {
        shop_id: shopId,
        status: "OPEN",
        cutoff_time: {
          lt: now,
        },
      },
      select: {
        id: true,
      },
    });

    for (const batch of expiredBatches) {
      try {
        await this.lockBatch(batch.id, shopId);
      } catch (err) {
        log.error({ err: err }, `Failed to auto-lock batch ${batch.id}:`);
      }
    }
  }

  async getNextSlot(shopId: string): Promise<
    | { enabled: false; cutoff_time: null; batch_id: null; is_open: boolean }
    | {
        enabled: true;
        cutoff_time: Date;
        batch_id: string | null;
        is_open: boolean;
      }
  > {
    const shop = await this.shopRepository.findById(shopId, {
      select: { id: true, is_active: true, accepting_orders: true },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    const isOpen = shop.is_active && shop.accepting_orders;

    await this.autoLockExpiredBatches(shopId);

    const slots = await this.getActiveSlots(shopId);
    if (slots.length === 0) {
      return {
        enabled: false,
        cutoff_time: null,
        batch_id: null,
        is_open: isOpen,
      };
    }

    const cutoffTime = await this.computeNextCutoffFromSlots(
      shopId,
      new Date(),
      slots
    );

    const openForCutoff = await this.batchRepository.findOpenBatchByCutoff(
      shopId,
      cutoffTime,
      { select: { id: true } }
    );

    return {
      enabled: true,
      cutoff_time: cutoffTime,
      batch_id: openForCutoff?.id ?? null,
      is_open: isOpen,
    };
  }

  async ensureNextOpenBatch(shopId: string): Promise<void> {
    const slots = await this.getActiveSlots(shopId);
    if (slots.length === 0) {
      return;
    }

    const cutoffTime = await this.computeNextCutoffFromSlots(
      shopId,
      new Date(),
      slots
    );
    const existing = await this.batchRepository.findOpenBatchByCutoff(
      shopId,
      cutoffTime,
      { select: { id: true } }
    );

    if (existing) {
      return;
    }

    const cutoffZoned = getZonedParts(cutoffTime, APP_TIME_ZONE);
    const minutesFromMidnight = cutoffZoned.hour * 60 + cutoffZoned.minute;
    const slot = slots.find(
      (item) => item.cutoff_time_minutes === minutesFromMidnight
    );

    await this.batchRepository.create({
      data: {
        shop_id: shopId,
        cutoff_time: cutoffTime,
        status: "OPEN",
        slot_id: slot?.id,
      },
    });
  }

  async getVendorDashboard(shopId: string): Promise<{
    open_batch: BatchInfo | null;
    active_batches: BatchInfo[];
    direct_orders: DirectOrderInfo[];
  }> {
    await this.autoLockExpiredBatches(shopId);
    await this.ensureNextOpenBatch(shopId);

    const orderSelect = {
      id: true,
      display_id: true,
      order_status: true,
      item_total: true,
      delivery_fee: true,
      platform_fee: true,
      user: { select: { phone: true } },
      delivery_address: {
        select: {
          hostel_block: true,
          label: true,
          building: true,
          room_number: true,
        },
      },
    };

    const [openBatches, activeBatches] = await Promise.all([
      this.batchRepository.findOpenBatches(shopId, {
        include: { orders: { select: orderSelect } },
      }),
      this.batchRepository.findActiveBatches(shopId, {
        include: { orders: { select: orderSelect } },
      }),
    ]);
    const [openBatch = null, ...extraOpenBatches] = openBatches;

    const formatBatch = async (
      batch: typeof openBatch
    ): Promise<BatchInfo | null> => {
      if (!batch) return null;

      const totalEarnings = batch.orders.reduce((sum, order) => {
        return (
          sum +
          Number(order.item_total) +
          Number(order.delivery_fee) -
          Number(order.platform_fee)
        );
      }, 0);

      const batchInfo: BatchInfo = {
        id: batch.id,
        status: batch.status,
        cutoff_time: batch.cutoff_time,
        order_count: batch.orders.length,
        total_earnings: Math.round(totalEarnings * 100) / 100,
      };

      batchInfo.orders = batch.orders.map((order) => ({
        id: order.id,
        display_id: order.display_id,
        status: order.order_status,
        phone: order.user?.phone ?? null,
        delivery_address: order.delivery_address,
      }));

      if (batch.status === "LOCKED" || batch.status === "IN_TRANSIT") {
        batchInfo.item_summary = await this.getBatchSummary(batch.id);
      }
      return batchInfo;
    };

    const formattedOpenBatch = await formatBatch(openBatch);
    const formattedActiveBatches: BatchInfo[] = [];

    for (const batch of [...extraOpenBatches, ...activeBatches]) {
      const formatted = await formatBatch(batch as typeof openBatch);
      if (formatted) {
        formattedActiveBatches.push(formatted);
      }
    }

    const directOrdersRaw = await this.orderRepository.getOrdersByIds([], {
      where: {
        shop_id: shopId,
        order_status: { notIn: ["COMPLETED", "CANCELLED"] },
        OR: [{ is_direct_delivery: true }, { batch_id: null }],
      },
      select: {
        id: true,
        display_id: true,
        order_status: true,
        item_total: true,
        delivery_fee: true,
        platform_fee: true,
        created_at: true,
        user: { select: { phone: true } },
        delivery_address: {
          select: {
            hostel_block: true,
            label: true,
            building: true,
            room_number: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const directOrders: DirectOrderInfo[] = directOrdersRaw.map((order) => ({
      id: order.id,
      display_id: order.display_id,
      status: order.order_status,
      phone: order.user?.phone ?? null,
      item_total: Number(order.item_total),
      delivery_fee: Number(order.delivery_fee),
      platform_fee: Number(order.platform_fee),
      total_earnings:
        Math.round(
          (Number(order.item_total) +
            Number(order.delivery_fee) -
            Number(order.platform_fee)) *
            100
        ) / 100,
      created_at: order.created_at,
      delivery_address: order.delivery_address,
    }));

    return {
      open_batch: formattedOpenBatch,
      active_batches: formattedActiveBatches,
      direct_orders: directOrders,
    };
  }

  async unlockBatch(batchId: string): Promise<void> {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.status !== "LOCKED") {
      throw new Error("Only LOCKED batches can be unlocked");
    }

    await this.batchRepository.updateStatus(batchId, "OPEN");

    const orders = await this.orderRepository.getOrdersByIds([], {
      where: { batch_id: batchId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await this.orderRepository.batchUpdateOrders(orderIds, {
        order_status: "NEW",
        delivery_otp: null,
      });
    }
  }

  async startDelivery(batchId: string): Promise<void> {
    const batch = await this.batchRepository.findById(batchId, {
      include: {
        orders: {
          select: {
            id: true,
            user_id: true,
            display_id: true,
            delivery_otp: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.status !== "LOCKED") {
      throw new Error("Only LOCKED batches can start delivery");
    }

    await this.batchRepository.updateStatus(batchId, "IN_TRANSIT");

    const orderIds = batch.orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await this.orderRepository.batchUpdateStatus(
        orderIds,
        "OUT_FOR_DELIVERY"
      );

      for (const order of batch.orders) {
        if (order.user_id) {
          try {
            await this.notificationService.publishNotification(order.user_id, {
              title: "🚀 Order Out for Delivery!",
              message: `Your order ${order.display_id} is out for delivery in the batch run. Share OTP ${order.delivery_otp || ""} to complete delivery.`,
              type: "SUCCESS",
              category: "ORDER",
              action_url: `/orders/${order.id}`,
            });
          } catch (notifyErr) {
            log.error(
              { err: notifyErr },
              `Failed to send delivery notification for order ${order.id}:`
            );
          }
        }
      }
    }
  }

  async completeBatch(batchId: string): Promise<void> {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.status !== "IN_TRANSIT") {
      throw new Error("Only IN_TRANSIT batches can be completed");
    }

    const pendingOrders =
      await this.batchRepository.countPendingOrders(batchId);

    if (pendingOrders > 0) {
      throw new Error(`${pendingOrders} orders still pending OTP verification`);
    }

    await this.batchRepository.updateStatus(batchId, "COMPLETED");
  }

  async generateOtpForBatch(batchId: string): Promise<void> {
    const orders = await this.orderRepository.getOrdersByIds([], {
      where: { batch_id: batchId },
      select: { id: true },
    });

    if (orders.length === 0) {
      return;
    }

    await Promise.all(
      orders.map((order) =>
        this.orderRepository.update(order.id, {
          delivery_otp: this.generateOtp(),
        })
      )
    );
  }

  async verifyOrderOtp(
    orderId: string,
    otp: string,
    shopId: string
  ): Promise<{ success: boolean; message: string }> {
    const order = await this.orderRepository.getOrderById(orderId, {
      select: {
        id: true,
        delivery_otp: true,
        order_status: true,
        shop_id: true,
        batch_id: true,
        payment_method: true,
        user_id: true,
        display_id: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.shop_id !== shopId) {
      throw new Error("Unauthorized: Order does not belong to your shop");
    }

    if (order.order_status !== "OUT_FOR_DELIVERY") {
      throw new Error("Order is not out for delivery");
    }

    if (order.delivery_otp !== otp) {
      return { success: false, message: "Invalid OTP" };
    }

    await this.orderRepository.update(orderId, {
      order_status: "COMPLETED",
      actual_delivery_time: new Date(),
      delivery_otp: null,
      payment_status: order.payment_method === "CASH" ? "COMPLETED" : undefined,
    });

    if (order.user_id) {
      try {
        await this.notificationService.publishNotification(order.user_id, {
          title: "🎉 Order Delivered!",
          message: `Your order ${order.display_id} was successfully delivered. Thank you!`,
          type: "SUCCESS",
          category: "ORDER",
          action_url: `/orders/${orderId}`,
        });
      } catch (notifyErr) {
        log.error(
          { err: notifyErr },
          "Failed to send order delivery notification:"
        );
      }
    }

    return { success: true, message: "Order delivered successfully" };
  }

  async cancelBatch(
    batchId: string,
    _reason: string
  ): Promise<{ cancelled_orders: number }> {
    const batch = await this.batchRepository.findById(batchId, {
      include: {
        orders: {
          select: {
            id: true,
            user_id: true,
            payment_status: true,
            display_id: true,
            payment_method: true,
          },
        },
        shop: { select: { name: true } },
      },
    });

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.status !== "LOCKED" && batch.status !== "IN_TRANSIT") {
      throw new Error("Can only cancel LOCKED or IN_TRANSIT batches");
    }

    await this.batchRepository.updateStatus(batchId, "CANCELLED");

    const orderIds = batch.orders.map((o) => o.id);

    if (orderIds.length > 0) {
      for (const order of batch.orders) {
        const paymentStatus =
          order.payment_method === "ONLINE" ? "REFUNDED" : "CANCELLED";

        await this.orderRepository.update(order.id, {
          order_status: "CANCELLED",
          payment_status: paymentStatus,
          delivery_otp: null,
        });

        if (order.user_id) {
          try {
            await this.notificationService.publishNotification(order.user_id, {
              title: "❌ Order Batch Cancelled",
              message: `Your order ${order.display_id} was cancelled because the delivery run was cancelled. A refund has been initiated if you paid online.`,
              type: "ERROR",
              category: "ORDER",
              action_url: `/orders/${order.id}`,
            });
          } catch (notifyErr) {
            log.error({
              err: notifyErr,
              message: "Failed to send batch cancellation notification",
              orderId: order.id,
            });
          }
        }
      }
    }

    return { cancelled_orders: orderIds.length };
  }

  private generateOtp(): string {
    try {
      return randomInt(1000, 10000).toString().padStart(4, "0");
    } catch {
      return Math.floor(1000 + Math.random() * 9000).toString();
    }
  }
}
