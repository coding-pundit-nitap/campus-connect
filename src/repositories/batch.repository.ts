import {
  Batch,
  BatchSlot,
  BatchStatus,
  OrderStatus,
  Prisma,
} from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export class BatchRepository extends BaseRepository<
  Batch,
  Prisma.BatchFindUniqueArgs,
  Prisma.BatchFindManyArgs,
  Prisma.BatchCreateArgs,
  Prisma.BatchUpdateArgs,
  Prisma.BatchDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.batch);
  }

  async findFirst<T extends Prisma.BatchFindFirstArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.BatchDelegate, T, "findFirst"> | null> {
    return this.prismaClient.batch.findFirst(args) as any;
  }

  async findById(batch_id: string): Promise<Batch | null>;
  async findById<T extends Omit<Prisma.BatchFindUniqueArgs, "where">>(
    batch_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.BatchDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    batch_id: string,
    options?: Omit<Prisma.BatchFindUniqueArgs, "where">
  ): Promise<
    | Batch
    | null
    | Prisma.Result<
        Prisma.BatchDelegate,
        Omit<Prisma.BatchFindUniqueArgs, "where"> & { where: { id: string } },
        "findUnique"
      >
  > {
    const query = { where: { id: batch_id }, ...(options ?? {}) };
    return this.prismaClient.batch.findUnique(query);
  }

  async findFirstByShopId(shop_id: string): Promise<Batch | null>;
  async findFirstByShopId<T extends Omit<Prisma.BatchFindFirstArgs, "where">>(
    shop_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.BatchDelegate,
    T & { where: { shop_id: string } },
    "findFirst"
  > | null>;
  async findFirstByShopId(
    shop_id: string,
    options?: Omit<Prisma.BatchFindFirstArgs, "where">
  ): Promise<
    | Batch
    | null
    | Prisma.Result<
        Prisma.BatchDelegate,
        Omit<Prisma.BatchFindFirstArgs, "where"> & {
          where: { shop_id: string };
        },
        "findFirst"
      >
  > {
    const query = { where: { shop_id }, ...(options ?? {}) };
    return this.prismaClient.batch.findFirst(query);
  }

  async findOpenBatchByShopId(shop_id: string): Promise<Batch | null>;
  async findOpenBatchByShopId<
    T extends Omit<Prisma.BatchFindFirstArgs, "where">,
  >(
    shop_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.BatchDelegate,
    T & { where: { shop_id: string; status: "OPEN" } },
    "findFirst"
  > | null>;
  async findOpenBatchByShopId(
    shop_id: string,
    options?: Omit<Prisma.BatchFindFirstArgs, "where">
  ): Promise<
    | Batch
    | null
    | Prisma.Result<
        Prisma.BatchDelegate,
        Omit<Prisma.BatchFindFirstArgs, "where"> & {
          where: { shop_id: string; status: "OPEN" };
        },
        "findFirst"
      >
  > {
    const query = {
      where: { shop_id, status: "OPEN" as BatchStatus },
      orderBy: { cutoff_time: "asc" as const },
      ...(options ?? {}),
    };
    return this.prismaClient.batch.findFirst(query);
  }

  async findOpenBatches(shop_id: string): Promise<Batch[]>;
  async findOpenBatches<T extends Omit<Prisma.BatchFindManyArgs, "where">>(
    shop_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.BatchDelegate,
      T & { where: { shop_id: string; status: "OPEN" } },
      "findMany"
    >
  >;
  async findOpenBatches(
    shop_id: string,
    options?: Omit<Prisma.BatchFindManyArgs, "where">
  ): Promise<
    | Batch[]
    | Prisma.Result<
        Prisma.BatchDelegate,
        Omit<Prisma.BatchFindManyArgs, "where"> & {
          where: { shop_id: string; status: "OPEN" };
        },
        "findMany"
      >
  > {
    const query = {
      where: { shop_id, status: "OPEN" as BatchStatus },
      orderBy: { cutoff_time: "asc" as const },
      ...(options ?? {}),
    };
    return this.prismaClient.batch.findMany(query);
  }

  async findActiveBatches(shop_id: string): Promise<Batch[]>;
  async findActiveBatches<T extends Omit<Prisma.BatchFindManyArgs, "where">>(
    shop_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.BatchDelegate,
      T & { where: { shop_id: string; status: { in: BatchStatus[] } } },
      "findMany"
    >
  >;
  async findActiveBatches(
    shop_id: string,
    options?: Omit<Prisma.BatchFindManyArgs, "where">
  ): Promise<
    | Batch[]
    | Prisma.Result<
        Prisma.BatchDelegate,
        Omit<Prisma.BatchFindManyArgs, "where"> & {
          where: { shop_id: string; status: { in: BatchStatus[] } };
        },
        "findMany"
      >
  > {
    const query = {
      where: {
        shop_id,
        status: { in: ["LOCKED", "IN_TRANSIT"] as BatchStatus[] },
      },
      orderBy: { cutoff_time: "desc" as const },
      ...(options ?? {}),
    };
    return this.prismaClient.batch.findMany(query);
  }

  async findOpenBatchByCutoff(
    shop_id: string,
    cutoff_time: Date
  ): Promise<Batch | null>;
  async findOpenBatchByCutoff<
    T extends Omit<Prisma.BatchFindFirstArgs, "where">,
  >(
    shop_id: string,
    cutoff_time: Date,
    options: T
  ): Promise<Prisma.Result<
    Prisma.BatchDelegate,
    T & { where: { shop_id: string; status: "OPEN"; cutoff_time: Date } },
    "findFirst"
  > | null>;
  async findOpenBatchByCutoff(
    shop_id: string,
    cutoff_time: Date,
    options?: Omit<Prisma.BatchFindFirstArgs, "where">
  ): Promise<
    | Batch
    | null
    | Prisma.Result<
        Prisma.BatchDelegate,
        Omit<Prisma.BatchFindFirstArgs, "where"> & {
          where: { shop_id: string; status: "OPEN"; cutoff_time: Date };
        },
        "findFirst"
      >
  > {
    const query = {
      where: {
        shop_id,
        status: "OPEN" as BatchStatus,
        cutoff_time,
      },
      ...(options ?? {}),
    };
    return this.prismaClient.batch.findFirst(query);
  }

  async updateStatus(batch_id: string, status: BatchStatus): Promise<Batch> {
    return this.prismaClient.batch.update({
      where: { id: batch_id },
      data: { status },
    });
  }

  async update<T extends Prisma.BatchUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.BatchDelegate, T, "update">>;
  override async update(args: Prisma.BatchUpdateArgs): Promise<Batch>;
  async update<T extends Omit<Prisma.BatchUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.BatchUpdateInput,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.BatchDelegate,
      T & { where: { id: string }; data: Prisma.BatchUpdateInput },
      "update"
    >
  >;
  override async update(
    idOrArgs: string | Prisma.BatchUpdateArgs,
    data?: Prisma.BatchUpdateInput,
    options?: Omit<Prisma.BatchUpdateArgs, "where" | "data">
  ): Promise<
    | Batch
    | Prisma.Result<Prisma.BatchDelegate, Prisma.BatchUpdateArgs, "update">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.batch.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.batch.update(idOrArgs);
  }

  async findActiveSlots(shop_id: string): Promise<BatchSlot[]>;
  async findActiveSlots<T extends Omit<Prisma.BatchSlotFindManyArgs, "where">>(
    shop_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.BatchSlotDelegate,
      T & { where: { shop_id: string; is_active: true } },
      "findMany"
    >
  >;
  async findActiveSlots(
    shop_id: string,
    options?: Omit<Prisma.BatchSlotFindManyArgs, "where">
  ): Promise<
    | BatchSlot[]
    | Prisma.Result<
        Prisma.BatchSlotDelegate,
        Omit<Prisma.BatchSlotFindManyArgs, "where"> & {
          where: { shop_id: string; is_active: true };
        },
        "findMany"
      >
  > {
    try {
      const query = {
        where: { shop_id, is_active: true },
        orderBy: [
          { sort_order: "asc" as const },
          { cutoff_time_minutes: "asc" as const },
        ],
        ...(options ?? {}),
      };
      return this.prismaClient.batchSlot.findMany(query);
    } catch {
      return [];
    }
  }

  async getOrderItemSummary(batch_id: string) {
    return this.prismaClient.orderItem.groupBy({
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
    return this.prismaClient.order.count({
      where: {
        batch_id,
        order_status,
      },
    });
  }

  async findManyByShopId(shop_id: string): Promise<BatchSlot[]> {
    return this.prismaClient.batchSlot.findMany({
      where: { shop_id },
    });
  }

  async findBatchesByTimeRange(shop_id: string, start: Date, end: Date) {
    return this.prismaClient.batch.findMany({
      where: {
        shop_id,
        cutoff_time: { gte: start, lte: end },
      },
      select: { cutoff_time: true, status: true },
    });
  }
}

export const batchRepository = new BatchRepository();
export default batchRepository;
