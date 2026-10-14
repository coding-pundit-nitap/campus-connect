import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";

import { BatchRepository } from "./batch.repository";

describe("BatchRepository", () => {
  let prisma: PrismaMock;
  let repo: BatchRepository;
  const cutoff = new Date("2026-01-01T10:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    repo = new BatchRepository(asPrisma(prisma));
  });

  it("findFirst forwards args and returns the row", async () => {
    prisma.batch.findFirst.mockResolvedValueOnce({ id: "b1" });
    await expect(repo.findFirst({ where: { id: "b1" } })).resolves.toEqual({
      id: "b1",
    });
    expect(prisma.batch.findFirst).toHaveBeenCalledWith({
      where: { id: "b1" },
    });
  });

  describe("findById", () => {
    it("queries by id without options", async () => {
      prisma.batch.findUnique.mockResolvedValueOnce({ id: "b1" });
      await expect(repo.findById("b1")).resolves.toEqual({ id: "b1" });
      expect(prisma.batch.findUnique).toHaveBeenCalledWith({
        where: { id: "b1" },
      });
    });

    it("keeps include but forces the id over a caller where", async () => {
      await repo.findById("b1", {
        include: { orders: true },
        where: { id: "other" },
      } as unknown as Omit<Prisma.BatchFindUniqueArgs, "where">);
      expect(prisma.batch.findUnique).toHaveBeenCalledWith({
        include: { orders: true },
        where: { id: "b1" },
      });
    });
  });

  describe("findFirstByShopId", () => {
    it("queries by shop without options", async () => {
      await repo.findFirstByShopId("s1");
      expect(prisma.batch.findFirst).toHaveBeenCalledWith({
        where: { shop_id: "s1" },
      });
    });

    it("ANDs a caller filter under the shop scope", async () => {
      await repo.findFirstByShopId("s1", {
        orderBy: { cutoff_time: "desc" },
        where: { status: "OPEN", shop_id: "other" },
      } as unknown as Omit<Prisma.BatchFindFirstArgs, "where">);
      expect(prisma.batch.findFirst).toHaveBeenCalledWith({
        orderBy: { cutoff_time: "desc" },
        where: { status: "OPEN", shop_id: "s1" },
      });
    });
  });

  describe("findOpenBatchByShopId", () => {
    it("defaults to earliest cutoff first among OPEN batches", async () => {
      await repo.findOpenBatchByShopId("s1");
      expect(prisma.batch.findFirst).toHaveBeenCalledWith({
        orderBy: { cutoff_time: "asc" },
        where: { shop_id: "s1", status: "OPEN" },
      });
    });

    it("lets the caller override orderBy but not shop or status", async () => {
      await repo.findOpenBatchByShopId("s1", {
        orderBy: { created_at: "desc" },
        where: { status: "LOCKED", shop_id: "other" },
      } as unknown as Omit<Prisma.BatchFindFirstArgs, "where">);
      expect(prisma.batch.findFirst).toHaveBeenCalledWith({
        orderBy: { created_at: "desc" },
        where: { shop_id: "s1", status: "OPEN" },
      });
    });
  });

  describe("findOpenBatches", () => {
    it("lists OPEN batches by earliest cutoff by default", async () => {
      prisma.batch.findMany.mockResolvedValueOnce([{ id: "b1" }]);
      await expect(repo.findOpenBatches("s1")).resolves.toEqual([{ id: "b1" }]);
      expect(prisma.batch.findMany).toHaveBeenCalledWith({
        orderBy: { cutoff_time: "asc" },
        where: { shop_id: "s1", status: "OPEN" },
      });
    });

    it("keeps take and forces scope keys", async () => {
      await repo.findOpenBatches("s1", {
        take: 2,
        where: { status: "COMPLETED" },
      } as unknown as Omit<Prisma.BatchFindManyArgs, "where">);
      expect(prisma.batch.findMany).toHaveBeenCalledWith({
        orderBy: { cutoff_time: "asc" },
        take: 2,
        where: { shop_id: "s1", status: "OPEN" },
      });
    });
  });

  describe("findActiveBatches", () => {
    it("lists LOCKED and IN_TRANSIT batches by latest cutoff by default", async () => {
      await repo.findActiveBatches("s1");
      expect(prisma.batch.findMany).toHaveBeenCalledWith({
        orderBy: { cutoff_time: "desc" },
        where: { shop_id: "s1", status: { in: ["LOCKED", "IN_TRANSIT"] } },
      });
    });

    it("forces the active status set over a caller filter", async () => {
      await repo.findActiveBatches("s1", {
        where: { status: "OPEN", id: "b1" },
      } as unknown as Omit<Prisma.BatchFindManyArgs, "where">);
      expect(prisma.batch.findMany).toHaveBeenCalledWith({
        orderBy: { cutoff_time: "desc" },
        where: {
          id: "b1",
          shop_id: "s1",
          status: { in: ["LOCKED", "IN_TRANSIT"] },
        },
      });
    });
  });

  describe("findOpenBatchByCutoff", () => {
    it("matches shop, OPEN status and exact cutoff", async () => {
      await repo.findOpenBatchByCutoff("s1", cutoff);
      expect(prisma.batch.findFirst).toHaveBeenCalledWith({
        where: { shop_id: "s1", status: "OPEN", cutoff_time: cutoff },
      });
    });

    it("forces every scope key over a caller filter", async () => {
      await repo.findOpenBatchByCutoff("s1", cutoff, {
        select: { id: true },
        where: { cutoff_time: new Date(0), status: "LOCKED" },
      } as unknown as Omit<Prisma.BatchFindFirstArgs, "where">);
      expect(prisma.batch.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: { shop_id: "s1", status: "OPEN", cutoff_time: cutoff },
      });
    });
  });

  it("updateStatus updates the status by id", async () => {
    prisma.batch.update.mockResolvedValueOnce({ id: "b1", status: "LOCKED" });
    await expect(repo.updateStatus("b1", "LOCKED")).resolves.toEqual({
      id: "b1",
      status: "LOCKED",
    });
    expect(prisma.batch.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { status: "LOCKED" },
    });
  });

  describe("adjustCollectiveTotal", () => {
    it("returns null and writes nothing when the batch is missing", async () => {
      prisma.batch.findUnique.mockResolvedValueOnce(null);
      await expect(repo.adjustCollectiveTotal("b1", 10)).resolves.toBeNull();
      expect(prisma.batch.findUnique).toHaveBeenCalledWith({
        where: { id: "b1" },
        select: { collective_total: true },
      });
      expect(prisma.batch.update).not.toHaveBeenCalled();
    });

    it.each([
      ["adds and rounds to cents", "10.10", 0.205, 10.31],
      ["subtracts", 50, -20, 30],
      ["clamps at zero", 5, -20, 0],
    ])("%s", async (_label, current, delta, expected) => {
      prisma.batch.findUnique.mockResolvedValueOnce({
        collective_total: current,
      });
      prisma.batch.update.mockResolvedValueOnce({ id: "b1" });

      await expect(repo.adjustCollectiveTotal("b1", delta)).resolves.toEqual({
        id: "b1",
      });
      expect(prisma.batch.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { collective_total: expected },
      });
    });

    it("uses the transaction client when given", async () => {
      const tx = createPrismaMock();
      tx.batch.findUnique.mockResolvedValueOnce({ collective_total: 1 });
      tx.batch.update.mockResolvedValueOnce({ id: "b1" });

      await repo.adjustCollectiveTotal(
        "b1",
        1,
        tx as unknown as Prisma.TransactionClient
      );

      expect(tx.batch.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { collective_total: 2 },
      });
      expect(prisma.batch.findUnique).not.toHaveBeenCalled();
      expect(prisma.batch.update).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("update(args) forwards args", async () => {
      const args = { where: { id: "b1" }, data: { status: "OPEN" as const } };
      await repo.update(args);
      expect(prisma.batch.update).toHaveBeenCalledWith(args);
    });

    it("update(id, data, options) forces the id over a caller where", async () => {
      await repo.update("b1", { status: "LOCKED" }, {
        select: { id: true },
        where: { id: "other" },
      } as unknown as Omit<Prisma.BatchUpdateArgs, "where" | "data">);
      expect(prisma.batch.update).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "b1" },
        data: { status: "LOCKED" },
      });
    });

    it("update(id) without data sends an empty data object", async () => {
      await repo.update("b1", undefined as unknown as Prisma.BatchUpdateInput);
      expect(prisma.batch.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: {},
      });
    });
  });

  describe("findActiveSlots", () => {
    it("lists active slots ordered by sort order then cutoff", async () => {
      prisma.batchSlot.findMany.mockResolvedValueOnce([{ id: "slot-1" }]);
      await expect(repo.findActiveSlots("s1")).resolves.toEqual([
        { id: "slot-1" },
      ]);
      expect(prisma.batchSlot.findMany).toHaveBeenCalledWith({
        orderBy: [{ sort_order: "asc" }, { cutoff_time_minutes: "asc" }],
        where: { shop_id: "s1", is_active: true },
      });
    });

    it("lets options override orderBy but not the scope", async () => {
      await repo.findActiveSlots("s1", {
        orderBy: { label: "asc" },
        where: { is_active: false, shop_id: "other" },
      } as unknown as Omit<Prisma.BatchSlotFindManyArgs, "where">);
      expect(prisma.batchSlot.findMany).toHaveBeenCalledWith({
        orderBy: { label: "asc" },
        where: { shop_id: "s1", is_active: true },
      });
    });

    it("returns [] when building the query throws synchronously", async () => {
      prisma.batchSlot.findMany.mockImplementationOnce(() => {
        throw new Error("boom");
      });
      await expect(repo.findActiveSlots("s1")).resolves.toEqual([]);
    });
  });

  it("getOrderItemSummary sums quantity per product for the batch", async () => {
    prisma.orderItem.groupBy.mockResolvedValueOnce([
      { product_id: "p1", _sum: { quantity: 3 } },
    ]);
    await expect(repo.getOrderItemSummary("b1")).resolves.toEqual([
      { product_id: "p1", _sum: { quantity: 3 } },
    ]);
    expect(prisma.orderItem.groupBy).toHaveBeenCalledWith({
      by: ["product_id"],
      where: { order: { batch_id: "b1" } },
      _sum: { quantity: true },
    });
  });

  it.each([
    [undefined, "OUT_FOR_DELIVERY"],
    ["NEW", "NEW"],
  ] as const)(
    "countPendingOrders(status=%s) counts %s orders",
    async (status, expected) => {
      prisma.order.count.mockResolvedValueOnce(4);
      await expect(repo.countPendingOrders("b1", status)).resolves.toBe(4);
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { batch_id: "b1", order_status: expected },
      });
    }
  );

  it("findManyByShopId lists every slot for the shop", async () => {
    await repo.findManyByShopId("s1");
    expect(prisma.batchSlot.findMany).toHaveBeenCalledWith({
      where: { shop_id: "s1" },
    });
  });

  it("findBatchesByTimeRange selects cutoff and status within the range", async () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-01-02");
    await repo.findBatchesByTimeRange("s1", start, end);
    expect(prisma.batch.findMany).toHaveBeenCalledWith({
      where: { shop_id: "s1", cutoff_time: { gte: start, lte: end } },
      select: { cutoff_time: true, status: true },
    });
  });

  it("createManySlots inserts all slots", async () => {
    const slots = [
      {
        shop_id: "s1",
        label: "Lunch",
        cutoff_time_minutes: 720,
        sort_order: 0,
        is_active: true,
      },
    ] as unknown as Parameters<typeof repo.createManySlots>[0];
    prisma.batchSlot.createMany.mockResolvedValueOnce({ count: 1 });
    await expect(repo.createManySlots(slots)).resolves.toEqual({ count: 1 });
    expect(prisma.batchSlot.createMany).toHaveBeenCalledWith({ data: slots });
  });
});
