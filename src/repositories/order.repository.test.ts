import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderStatus, Prisma } from "@/generated/client";
import type { prisma } from "@/lib/prisma";
import { OrderRepository } from "@/repositories/order.repository";

vi.mock("@/lib/utils/order.utils", () => ({
  orderWithDetailsInclude: { testInclude: true },
}));

function buildFakePrismaClient() {
  const findUnique = vi.fn().mockResolvedValue({ id: "order-1" });
  const findMany = vi.fn().mockResolvedValue([{ id: "order-1" }]);
  const create = vi
    .fn()
    .mockResolvedValue({ id: "order-1", user_id: "user-1" });
  const update = vi.fn().mockResolvedValue({ id: "order-1" });
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const count = vi.fn().mockResolvedValue(1);

  const fakeClient = {
    order: {
      findUnique,
      findMany,
      create,
      update,
      updateMany,
      count,
    },
  };

  return {
    fakeClient,
    findUnique,
    findMany,
    create,
    update,
    updateMany,
    count,
  };
}

describe("OrderRepository (Unit)", () => {
  let fakeClient: ReturnType<typeof buildFakePrismaClient>["fakeClient"];
  let repo: OrderRepository;
  let spies: ReturnType<typeof buildFakePrismaClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    spies = buildFakePrismaClient();
    fakeClient = spies.fakeClient;
    repo = new OrderRepository(fakeClient as unknown as typeof prisma);
  });

  describe("getOrderById", () => {
    it("scopes by id and spreads options", async () => {
      await repo.getOrderById("order-1", {
        where: { status: "PENDING" } as Prisma.OrderWhereInput,
        include: { items: true },
      } as unknown as Omit<Prisma.OrderFindUniqueArgs, "where">);
      expect(spies.findUnique).toHaveBeenCalledTimes(1);
      expect(spies.findUnique.mock.calls[0][0]).toEqual({
        include: { items: true },
        where: { status: "PENDING", id: "order-1" },
      });
    });
  });

  describe("getOrdersByUserId", () => {
    it("scopes by user_id and spreads options", async () => {
      await repo.getOrdersByUserId("user-1", {
        where: { status: "PENDING" } as Prisma.OrderWhereInput,
        take: 5,
      } as unknown as Omit<Prisma.OrderFindManyArgs, "where">);
      expect(spies.findMany).toHaveBeenCalledTimes(1);
      expect(spies.findMany.mock.calls[0][0]).toEqual({
        take: 5,
        where: { status: "PENDING", user_id: "user-1" },
      });
    });
  });

  describe("getOrdersByShopId", () => {
    it("scopes by shop_id and spreads options", async () => {
      await repo.getOrdersByShopId("shop-1", {
        where: { status: "PENDING" } as Prisma.OrderWhereInput,
        skip: 2,
      } as unknown as Omit<Prisma.OrderFindManyArgs, "where">);
      expect(spies.findMany).toHaveBeenCalledTimes(1);
      expect(spies.findMany.mock.calls[0][0]).toEqual({
        skip: 2,
        where: { status: "PENDING", shop_id: "shop-1" },
      });
    });
  });

  describe("getOrdersByIds", () => {
    it("scopes by id in array and spreads options", async () => {
      await repo.getOrdersByIds(["order-1", "order-2"], {
        where: { status: "PENDING" } as Prisma.OrderWhereInput,
      } as unknown as Omit<Prisma.OrderFindManyArgs, "where">);
      expect(spies.findMany).toHaveBeenCalledTimes(1);
      expect(spies.findMany.mock.calls[0][0]).toEqual({
        where: { status: "PENDING", id: { in: ["order-1", "order-2"] } },
      });
    });
  });

  describe("create", () => {
    it("delegates to prisma when args object passed", async () => {
      await repo.create({
        data: { user_id: "user-1" },
      } as Prisma.OrderCreateArgs);
      expect(spies.create).toHaveBeenCalledTimes(1);
      expect(spies.create.mock.calls[0][0]).toEqual({
        data: { user_id: "user-1" },
      });
    });

    it("uses tx when provided and creates directly", async () => {
      const txClient = {
        order: {
          create: vi
            .fn()
            .mockResolvedValue({ id: "order-1", user_id: "user-1" }),
        },
      };
      await repo.create(
        { user_id: "user-1" } as unknown as Prisma.OrderCreateInput,
        txClient as unknown as Prisma.TransactionClient
      );
      expect(txClient.order.create).toHaveBeenCalledTimes(1);
      expect(txClient.order.create.mock.calls[0][0]).toEqual({
        data: { user_id: "user-1" },
      });
    });

    it("throws if created order lacks user_id", async () => {
      spies.create.mockResolvedValueOnce({ id: "order-1", user_id: null });
      await expect(
        repo.create({ shop_id: "shop-1" } as unknown as Prisma.OrderCreateInput)
      ).rejects.toThrow("Order must have a user_id to be indexed.");
    });
  });

  describe("update", () => {
    it("scopes by id when id is passed as string", async () => {
      await repo.update(
        "order-1",
        { status: "PENDING" } as unknown as Prisma.OrderUpdateInput,
        {
          where: {
            shop_id: "shop-1",
          } as unknown as Prisma.OrderWhereUniqueInput,
          include: { items: true },
        } as unknown as Omit<Prisma.OrderUpdateArgs, "where" | "data">
      );
      expect(spies.update).toHaveBeenCalledTimes(1);
      expect(spies.update.mock.calls[0][0]).toEqual({
        include: { items: true },
        where: { shop_id: "shop-1", id: "order-1" },
        data: { status: "PENDING" },
      });
    });

    it("delegates when args object passed", async () => {
      await repo.update({
        where: { id: "order-1" },
        data: { status: "PENDING" },
      } as unknown as Prisma.OrderUpdateArgs);
      expect(spies.update).toHaveBeenCalledTimes(1);
      expect(spies.update.mock.calls[0][0]).toEqual({
        where: { id: "order-1" },
        data: { status: "PENDING" },
      });
    });
  });

  describe("updateStatus", () => {
    it("updates order status and fields", async () => {
      const date = new Date();
      await repo.updateStatus(
        "order-1",
        OrderStatus.COMPLETED,
        "driver-1",
        date
      );
      expect(spies.update).toHaveBeenCalledTimes(1);
      expect(spies.update.mock.calls[0][0]).toEqual({
        where: { id: "order-1" },
        data: {
          order_status: OrderStatus.COMPLETED,
          assigned_to: "driver-1",
          actual_delivery_time: date,
        },
      });
    });
  });

  describe("batchUpdateStatus", () => {
    it("updates status for multiple ids", async () => {
      await repo.batchUpdateStatus(
        ["order-1", "order-2"],
        OrderStatus.CANCELLED
      );
      expect(spies.updateMany).toHaveBeenCalledTimes(1);
      expect(spies.updateMany.mock.calls[0][0]).toEqual({
        where: { id: { in: ["order-1", "order-2"] } },
        data: { order_status: OrderStatus.CANCELLED },
      });
    });
  });

  describe("batchUpdateOrders", () => {
    it("updates fields for multiple ids", async () => {
      await repo.batchUpdateOrders(["order-1", "order-2"], {
        assigned_to: "driver-1",
      });
      expect(spies.updateMany).toHaveBeenCalledTimes(1);
      expect(spies.updateMany.mock.calls[0][0]).toEqual({
        where: { id: { in: ["order-1", "order-2"] } },
        data: { assigned_to: "driver-1" },
      });
    });
  });

  describe("getPaginatedShopOrdersFromDB", () => {
    it("builds query and calculates next cursor", async () => {
      spies.findMany.mockResolvedValueOnce([
        { id: "o1" },
        { id: "o2" },
        { id: "o3" },
      ]);
      const dateRange = { from: new Date(), to: new Date() };

      const res = await repo.getPaginatedShopOrdersFromDB({
        shop_id: "shop-1",
        limit: 2,
        cursor: "cursor-1",
        searchTerm: "query",
        orderStatus: OrderStatus.NEW,
        dateRange,
        hostelBlock: "A Block",
      });

      expect(res.orders).toEqual([{ id: "o1" }, { id: "o2" }]);
      expect(res.nextCursor).toBe("o3");
      expect(spies.findMany).toHaveBeenCalledTimes(1);

      const args = spies.findMany.mock.calls[0][0];
      expect(args.take).toBe(3); // limit + 1
      expect(args.cursor).toEqual({ id: "cursor-1" });
      expect(args.skip).toBe(1);
      expect(args.include).toEqual({ testInclude: true });
      expect(args.where.shop_id).toBe("shop-1");
      expect(args.where.order_status).toBe(OrderStatus.NEW);
      expect(args.where.delivery_address_snapshot).toEqual({
        string_contains: "A Block",
        mode: "insensitive",
      });
      expect(args.where.created_at).toEqual({
        gte: dateRange.from,
        lte: dateRange.to,
      });
      expect(args.where.OR).toBeDefined();
    });
  });

  describe("findById", () => {
    it("scopes by id", async () => {
      await repo.findById("order-1", {
        include: { items: true },
      } as unknown as Prisma.OrderFindUniqueArgs);
      expect(spies.findUnique).toHaveBeenCalledTimes(1);
      expect(spies.findUnique.mock.calls[0][0]).toEqual({
        include: { items: true },
        where: { id: "order-1" },
      });
    });
  });

  describe("findMany", () => {
    it("delegates", async () => {
      await repo.findMany({ take: 5 });
      expect(spies.findMany).toHaveBeenCalledTimes(1);
      expect(spies.findMany.mock.calls[0][0]).toEqual({ take: 5 });
    });
  });

  describe("count", () => {
    it("delegates", async () => {
      await repo.count({ where: { shop_id: "shop-1" } });
      expect(spies.count).toHaveBeenCalledTimes(1);
      expect(spies.count.mock.calls[0][0]).toEqual({
        where: { shop_id: "shop-1" },
      });
    });
  });
});
