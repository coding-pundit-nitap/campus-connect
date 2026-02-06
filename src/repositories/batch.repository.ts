import {
  Batch,
  BatchSlot,
  BatchStatus,
  OrderStatus,
  Prisma,
} from "@/../prisma/generated/client";
import { prisma } from "@/lib/prisma";

type BatchFindOptions = Omit<Prisma.BatchFindUniqueArgs, "where">;
type BatchFindManyOptions = Omit<Prisma.BatchFindManyArgs, "where">;
type BatchSlotFindManyOptions = Omit<Prisma.BatchSlotFindManyArgs, "where">;

class BatchRepository {
  async findById(batch_id: string): Promise<Batch | null>;
  async findById<T extends BatchFindOptions>(
    batch_id: string,
    options: T
  ): Promise<Prisma.BatchGetPayload<{ where: { id: string } } & T> | null>;
  async findById<T extends BatchFindOptions>(
    batch_id: string,
    options?: T
  ): Promise<
    Prisma.BatchGetPayload<{ where: { id: string } } & T> | Batch | null
  > {
    const query = { where: { id: batch_id }, ...(options ?? {}) };
    return prisma.batch.findUnique(query);
  }

  async findFirstByShopId(shop_id: string): Promise<Batch | null>;
  async findFirstByShopId<T extends BatchFindOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.BatchGetPayload<T> | null>;
  async findFirstByShopId<T extends BatchFindOptions>(
    shop_id: string,
    options?: T
  ): Promise<Prisma.BatchGetPayload<T> | Batch | null> {
    const query = { where: { shop_id }, ...(options ?? {}) };
    return prisma.batch.findFirst(query);
  }

  async findOpenBatchByShopId(shop_id: string): Promise<Batch | null>;
  async findOpenBatchByShopId<T extends BatchFindOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.BatchGetPayload<T> | null>;
  async findOpenBatchByShopId<T extends BatchFindOptions>(
    shop_id: string,
    options?: T
  ): Promise<Prisma.BatchGetPayload<T> | Batch | null> {
    const query = {
      where: { shop_id, status: "OPEN" },
      orderBy: { cutoff_time: "asc" },
      ...(options ?? {}),
    } as Prisma.BatchFindFirstArgs;
    return prisma.batch.findFirst(query);
  }

  async findActiveBatches(shop_id: string): Promise<Batch[]>;
  async findActiveBatches<T extends BatchFindManyOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.BatchGetPayload<T>[]>;
  async findActiveBatches<T extends BatchFindManyOptions>(
    shop_id: string,
    options?: T
  ): Promise<Prisma.BatchGetPayload<T>[] | Batch[]> {
    const query = {
      where: {
        shop_id,
        status: { in: ["LOCKED", "IN_TRANSIT"] as BatchStatus[] },
      },
      orderBy: { cutoff_time: "desc" },
      ...(options ?? {}),
    } as Prisma.BatchFindManyArgs;
    return prisma.batch.findMany(query);
  }

  async findOpenBatchByCutoff(
    shop_id: string,
    cutoff_time: Date
  ): Promise<Batch | null>;
  async findOpenBatchByCutoff<T extends BatchFindOptions>(
    shop_id: string,
    cutoff_time: Date,
    options: T
  ): Promise<Prisma.BatchGetPayload<T> | null>;
  async findOpenBatchByCutoff<T extends BatchFindOptions>(
    shop_id: string,
    cutoff_time: Date,
    options?: T
  ): Promise<Prisma.BatchGetPayload<T> | Batch | null> {
    const query = {
      where: {
        shop_id,
        status: "OPEN",
        cutoff_time,
      },
      ...(options ?? {}),
    } as Prisma.BatchFindFirstArgs;
    return prisma.batch.findFirst(query);
  }

  async updateStatus(batch_id: string, status: BatchStatus): Promise<Batch> {
    return prisma.batch.update({
      where: { id: batch_id },
      data: { status },
    });
  }

  async update(
    batch_id: string,
    data: Prisma.BatchUpdateInput
  ): Promise<Batch> {
    return prisma.batch.update({
      where: { id: batch_id },
      data,
    });
  }

  async findActiveSlots(shop_id: string): Promise<BatchSlot[]>;
  async findActiveSlots<T extends BatchSlotFindManyOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.BatchSlotGetPayload<T>[]>;
  async findActiveSlots<T extends BatchSlotFindManyOptions>(
    shop_id: string,
    options?: T
  ): Promise<Prisma.BatchSlotGetPayload<T>[] | BatchSlot[]> {
    try {
      const query = {
        where: { shop_id, is_active: true },
        orderBy: [{ sort_order: "asc" }, { cutoff_time_minutes: "asc" }],
        ...(options ?? {}),
      } as Prisma.BatchSlotFindManyArgs;
      return prisma.batchSlot.findMany(query);
    } catch {
      return [];
    }
  }
  async getOrderItemSummary(batch_id: string) {
    return prisma.orderItem.groupBy({
      by: ["product_id"],
      where: {
        order: {
          batch_id,
        },
      },
      _sum: {
        quantity: true,
      },
    });
  }

  async countPendingOrders(
    batch_id: string,
    order_status: OrderStatus = "OUT_FOR_DELIVERY"
  ): Promise<number> {
    return prisma.order.count({
      where: {
        batch_id,
        order_status,
      },
    });
  }
}

const batchRepository = new BatchRepository();
export default batchRepository;
