import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderStatus, Prisma } from "@/generated/client";
import { OrderRepository } from "@/repositories/order.repository";

vi.mock("@/lib/utils/order.utils", () => ({
  orderWithDetailsInclude: { testInclude: true },
}));

describe("OrderRepository (Unit)", () => {
  let prisma: PrismaMock;
  let spies: PrismaMock["order"];
  let repo: OrderRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    spies = prisma.order;
    spies.findUnique.mockResolvedValue({ id: "order-1" });
    spies.findMany.mockResolvedValue([{ id: "order-1" }]);
    spies.create.mockResolvedValue({ id: "order-1", user_id: "user-1" });
    spies.update.mockResolvedValue({ id: "order-1" });
    spies.updateMany.mockResolvedValue({ count: 1 });
    spies.count.mockResolvedValue(1);
    repo = new OrderRepository(asPrisma(prisma));
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
      const txClient = createPrismaMock();
      txClient.order.create.mockResolvedValue({
        id: "order-1",
        user_id: "user-1",
      });
      await repo.create(
        { user_id: "user-1" } as unknown as Prisma.OrderCreateInput,
        txClient as unknown as Prisma.TransactionClient
      );
      expect(txClient.order.create).toHaveBeenCalledTimes(1);
      expect(txClient.order.create.mock.calls[0][0]).toEqual({
        data: { user_id: "user-1" },
      });
      expect(spies.create).not.toHaveBeenCalled();
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

  describe("scoped finders without options", () => {
    it("getOrderById queries by id only", async () => {
      const result = await repo.getOrderById("order-1");
      expect(spies.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
      });
      expect(result).toEqual({ id: "order-1" });
    });

    it("getOrdersByUserId queries by user_id only", async () => {
      const result = await repo.getOrdersByUserId("user-1");
      expect(spies.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
      });
      expect(result).toEqual([{ id: "order-1" }]);
    });

    it("getOrdersByUserId never lets a caller filter replace user_id", async () => {
      await repo.getOrdersByUserId("user-1", {
        where: { user_id: "victim", order_status: undefined },
      });
      expect(spies.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-1", order_status: undefined },
      });
    });

    it("getOrdersByShopId never lets a caller filter replace shop_id", async () => {
      await repo.getOrdersByShopId("shop-1");
      expect(spies.findMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1" },
      });
    });

    it("getOrdersByIds queries by id list only", async () => {
      await repo.getOrdersByIds(["a"]);
      expect(spies.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["a"] } },
      });
    });

    it("findById queries by id only", async () => {
      await repo.findById("order-1");
      expect(spies.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
      });
    });
  });

  describe("create without tx", () => {
    it("creates through the injected client and returns the order", async () => {
      const result = await repo.create({
        user_id: "user-1",
      } as unknown as Prisma.OrderCreateInput);

      expect(spies.create).toHaveBeenCalledWith({
        data: { user_id: "user-1" },
      });
      expect(result).toEqual({ id: "order-1", user_id: "user-1" });
    });
  });

  describe("update with tx", () => {
    it("routes the id overload through tx and defaults data to {}", async () => {
      const tx = createPrismaMock();
      tx.order.update.mockResolvedValue({ id: "order-1" });

      await repo.update(
        "order-1",
        undefined as unknown as Prisma.OrderUpdateInput,
        undefined,
        tx as unknown as Prisma.TransactionClient
      );

      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {},
      });
      expect(spies.update).not.toHaveBeenCalled();
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
    it("omits order_status from the where clause when no status filter is given", async () => {
      spies.findMany.mockResolvedValueOnce([]);

      await repo.getPaginatedShopOrdersFromDB({ shop_id: "shop-1" });

      const args = spies.findMany.mock.calls[0][0];
      expect(args.where).not.toHaveProperty("order_status");
    });

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
      // The cursor is the last row returned: the next query uses `skip: 1`,
      // so pointing at the trimmed look-ahead row would skip it.
      expect(res.nextCursor).toBe("o2");
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
      expect(args.where.OR).toEqual([
        { display_id: { contains: "query", mode: "insensitive" } },
        {
          delivery_address_snapshot: {
            string_contains: "query",
            mode: "insensitive",
          },
        },
        { user: { email: { contains: "query", mode: "insensitive" } } },
      ]);
      expect(args.orderBy).toEqual([{ created_at: "desc" }, { id: "desc" }]);
    });

    it("uses only the shop scope, default limit and no cursor when no filters are given", async () => {
      spies.findMany.mockResolvedValueOnce([{ id: "o1" }]);

      const res = await repo.getPaginatedShopOrdersFromDB({
        shop_id: "shop-1",
      });

      expect(spies.findMany).toHaveBeenCalledWith({
        take: 11,
        where: { shop_id: "shop-1" },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        cursor: undefined,
        skip: 0,
        include: { testInclude: true },
      });
      expect(res).toEqual({ orders: [{ id: "o1" }], nextCursor: undefined });
    });

    it("does not report a next cursor when exactly `limit` rows come back", async () => {
      spies.findMany.mockResolvedValueOnce([{ id: "o1" }, { id: "o2" }]);

      const res = await repo.getPaginatedShopOrdersFromDB({
        shop_id: "shop-1",
        limit: 2,
      });

      expect(res.orders).toHaveLength(2);
      expect(res.nextCursor).toBeUndefined();
    });
  });

  describe("getPaginatedShopOrders", () => {
    it("forwards every option to the DB query with the default limit", async () => {
      spies.findMany.mockResolvedValueOnce([]);

      const res = await repo.getPaginatedShopOrders({
        shop_id: "shop-1",
        orderStatus: OrderStatus.NEW,
      });

      expect(spies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: { shop_id: "shop-1", order_status: OrderStatus.NEW },
        })
      );
      expect(res).toEqual({ orders: [], nextCursor: undefined });
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
