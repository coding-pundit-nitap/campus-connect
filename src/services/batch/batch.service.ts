import { randomInt } from "node:crypto";

import { BatchStatus } from "@/../prisma/generated/client";
import { NotFoundError } from "@/lib/custom-error";
import {
  addZonedDays,
  APP_TIME_ZONE,
  getZonedParts,
  zonedPartsToUtcDate,
} from "@/lib/utils/timezone";
import {
  batchRepository,
  orderRepository,
  productRepository,
  shopRepository,
} from "@/repositories";

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
    delivery_address?: {
      hostel_block: string | null;
      label: string;
      building: string;
      room_number: string;
    } | null;
  }[];
}

class BatchService {
  private async getActiveSlots(
    shopId: string
  ): Promise<
    { id: string; cutoff_time_minutes: number; sort_order: number }[]
  > {
    return batchRepository.findActiveSlots(shopId, {
      select: { id: true, cutoff_time_minutes: true, sort_order: true },
    });
  }

  private computeNextCutoffFromSlots(
    now: Date,
    slots: { cutoff_time_minutes: number }[]
  ): Date {
    const nowZoned = getZonedParts(now, APP_TIME_ZONE);
    const minutesNow = nowZoned.hour * 60 + nowZoned.minute;
    const sorted = [...slots].sort(
      (a, b) => a.cutoff_time_minutes - b.cutoff_time_minutes
    );

    const nextToday = sorted.find((s) => s.cutoff_time_minutes > minutesNow);
    const chosen = nextToday ?? sorted[0];

    const baseDate = nextToday
      ? { year: nowZoned.year, month: nowZoned.month, day: nowZoned.day }
      : addZonedDays(
          { year: nowZoned.year, month: nowZoned.month, day: nowZoned.day },
          1,
          APP_TIME_ZONE
        );

    const hour = Math.floor(chosen.cutoff_time_minutes / 60);
    const minute = chosen.cutoff_time_minutes % 60;

    return zonedPartsToUtcDate(
      { ...baseDate, hour, minute, second: 0 },
      APP_TIME_ZONE
    );
  }

  async lockBatch(batchId: string, shopId: string): Promise<void> {
    const batch = await batchRepository.findById(batchId, {
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

    await batchRepository.updateStatus(batchId, "LOCKED");

    const orders = await orderRepository.getOrdersByIds([], {
      where: { batch_id: batchId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await orderRepository.batchUpdateStatus(orderIds, "BATCHED");
    }

    await this.generateOtpForBatch(batchId);
  }

  async getBatchSummary(batchId: string): Promise<BatchSummaryItem[]> {
    const batch = await batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    const items = await batchRepository.getOrderItemSummary(batchId);

    const productIds = items.map((i) => i.product_id);
    const products = await productRepository.findManyByShopId("", {
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

  async getNextSlot(
    shopId: string
  ): Promise<
    | { enabled: false; cutoff_time: null; batch_id: null }
    | { enabled: true; cutoff_time: Date; batch_id: string | null }
  > {
    const shop = await shopRepository.findById(shopId, {
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    const slots = await this.getActiveSlots(shopId);
    if (slots.length === 0) {
      return { enabled: false, cutoff_time: null, batch_id: null };
    }

    const cutoffTime = this.computeNextCutoffFromSlots(new Date(), slots);

    const openForCutoff = await batchRepository.findOpenBatchByCutoff(
      shopId,
      cutoffTime,
      { select: { id: true } }
    );

    return {
      enabled: true,
      cutoff_time: cutoffTime,
      batch_id: openForCutoff?.id ?? null,
    };
  }

  async getVendorDashboard(shopId: string): Promise<{
    open_batch: BatchInfo | null;
    active_batches: BatchInfo[];
  }> {
    const openBatch = await batchRepository.findOpenBatchByShopId(shopId, {
      include: {
        orders: {
          select: {
            id: true,
            display_id: true,
            item_total: true,
            delivery_fee: true,
            platform_fee: true,
            delivery_address: {
              select: {
                hostel_block: true,
                label: true,
                building: true,
                room_number: true,
              },
            },
          },
        },
      },
    });

    const activeBatches = await batchRepository.findActiveBatches(shopId, {
      include: {
        orders: {
          select: {
            id: true,
            display_id: true,
            item_total: true,
            delivery_fee: true,
            platform_fee: true,
            delivery_address: {
              select: {
                hostel_block: true,
                label: true,
                building: true,
                room_number: true,
              },
            },
          },
        },
      },
    });

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
        delivery_address: order.delivery_address,
      }));

      if (batch.status === "LOCKED" || batch.status === "IN_TRANSIT") {
        batchInfo.item_summary = await this.getBatchSummary(batch.id);
      }
      return batchInfo;
    };

    const formattedOpenBatch = await formatBatch(openBatch);
    const formattedActiveBatches: BatchInfo[] = [];

    for (const batch of activeBatches) {
      const formatted = await formatBatch(batch);
      if (formatted) {
        formattedActiveBatches.push(formatted);
      }
    }

    return {
      open_batch: formattedOpenBatch,
      active_batches: formattedActiveBatches,
    };
  }

  async startDelivery(batchId: string): Promise<void> {
    const batch = await batchRepository.findById(batchId, {
      include: {
        orders: {
          select: {
            user_id: true,
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

    await batchRepository.updateStatus(batchId, "IN_TRANSIT");

    const orders = await orderRepository.getOrdersByIds([], {
      where: { batch_id: batchId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await orderRepository.batchUpdateStatus(orderIds, "OUT_FOR_DELIVERY");
    }
  }

  async completeBatch(batchId: string): Promise<void> {
    const batch = await batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.status !== "IN_TRANSIT") {
      throw new Error("Only IN_TRANSIT batches can be completed");
    }

    const pendingOrders = await batchRepository.countPendingOrders(batchId);

    if (pendingOrders > 0) {
      throw new Error(`${pendingOrders} orders still pending OTP verification`);
    }

    await batchRepository.updateStatus(batchId, "COMPLETED");
  }

  async generateOtpForBatch(batchId: string): Promise<void> {
    const orders = await orderRepository.getOrdersByIds([], {
      where: { batch_id: batchId },
      select: { id: true },
    });

    if (orders.length === 0) {
      return;
    }

    await Promise.all(
      orders.map((order) =>
        orderRepository.update(order.id, { delivery_otp: this.generateOtp() })
      )
    );
  }

  async verifyOrderOtp(
    orderId: string,
    otp: string,
    shopId: string
  ): Promise<{ success: boolean; message: string }> {
    const order = await orderRepository.getOrderById(orderId, {
      select: {
        id: true,
        delivery_otp: true,
        order_status: true,
        shop_id: true,
        batch_id: true,
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

    await orderRepository.update(orderId, {
      order_status: "COMPLETED",
      actual_delivery_time: new Date(),
      delivery_otp: null,
    });

    return { success: true, message: "Order delivered successfully" };
  }

  async cancelBatch(
    batchId: string,
    _reason: string
  ): Promise<{ cancelled_orders: number }> {
    const batch = await batchRepository.findById(batchId, {
      include: {
        orders: {
          select: { id: true, user_id: true, payment_status: true },
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

    await batchRepository.updateStatus(batchId, "CANCELLED");

    const orderIds = batch.orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await orderRepository.batchUpdateOrders(orderIds, {
        order_status: "CANCELLED",
        delivery_otp: null,
      });
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

export const batchService = new BatchService();
export default batchService;
