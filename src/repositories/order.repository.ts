import { Order, OrderStatus, Prisma } from "@/../prisma/generated/client";
import { elasticClient, INDICES } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { searchQueue } from "@/lib/search/search-producer";
import { orderWithDetailsInclude } from "@/lib/utils/order.utils";
import { OrderWithDetails } from "@/types";

type OrderFindOptions = Omit<Prisma.OrderFindUniqueArgs, "where">;

type OrderFindManyOptions = Omit<Prisma.OrderFindManyArgs, "where">;

type GetPaginatedOrdersOptions = {
  shop_id: string;
  limit?: number;
  cursor?: string;
  searchTerm?: string;
  orderStatus?: OrderStatus;
  dateRange?: { from: Date; to: Date };
};

class OrderRepository {
  async getOrderById(order_id: string): Promise<Order | null>;
  async getOrderById<T extends OrderFindOptions>(
    order_id: string,
    options: T
  ): Promise<Prisma.OrderGetPayload<{ where: { id: string } } & T> | null>;
  async getOrderById<T extends OrderFindOptions>(
    order_id: string,
    options?: T
  ): Promise<
    Prisma.OrderGetPayload<{ where: { id: string } } & T> | Order | null
  > {
    const query = { where: { id: order_id }, ...(options ?? {}) };
    return prisma.order.findUnique(query);
  }

  async getOrdersByUserId(user_id: string): Promise<Order[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    user_id: string,
    options: T
  ): Promise<Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    user_id: string,
    options?: T
  ): Promise<
    Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[] | Order[]
  > {
    const query = { where: { user_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  async getOrdersByShopId(shop_id: string): Promise<Order[]>;
  async getOrdersByShopId<T extends OrderFindManyOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.OrderGetPayload<{ where: { shop_id: string } } & T>[]>;
  async getOrdersByShopId<T extends OrderFindManyOptions>(
    shop_id: string,
    options?: T
  ): Promise<
    Prisma.OrderGetPayload<{ where: { shop_id: string } } & T>[] | Order[]
  > {
    const query = { where: { shop_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  async getOrdersByIds(order_ids: string[]): Promise<Order[]>;
  async getOrdersByIds<T extends OrderFindManyOptions>(
    order_ids: string[],
    options: T
  ): Promise<Prisma.OrderGetPayload<{ where: { id: { in: string[] } } } & T>[]>;
  async getOrdersByIds<T extends OrderFindManyOptions>(
    order_ids: string[],
    options?: T
  ): Promise<
    Prisma.OrderGetPayload<{ where: { id: { in: string[] } } } & T>[] | Order[]
  > {
    const query = { where: { id: { in: order_ids } }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  async create(
    data: Prisma.OrderCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Order> {
    const db = tx || prisma;
    const order = await db.order.create({
      data,
    });

    if (!order.user_id) {
      throw new Error("Order must have a user_id to be indexed.");
    }

    const user = await db.user.findUnique({
      where: { id: order.user_id },
      select: { email: true },
    });

    await searchQueue.add("index-order", {
      type: "INDEX_ORDER",
      payload: {
        id: order.id,
        shop_id: order.shop_id,
        display_id: order.display_id,
        user_email: user?.email,
        delivery_address: order.delivery_address_snapshot,
        status: order.order_status,
        created_at: order.created_at,
      },
    });
    return order;
  }

  async updateStatus(
    order_id: string,
    order_status: OrderStatus,
    assigned_to?: string,
    actual_delivery_time?: Date
  ): Promise<Order> {
    const order = await prisma.order.update({
      where: { id: order_id },
      data: {
        order_status,
        assigned_to,
        actual_delivery_time,
      },
    });

    await searchQueue.add("update-order", {
      type: "UPDATE_ORDER_STATUS",
      payload: {
        id: order.id,
        status: order.order_status,
      },
    });
    return order;
  }

  async batchUpdateStatus(
    order_ids: string[],
    order_status: OrderStatus
  ): Promise<Prisma.BatchPayload> {
    const result = await prisma.order.updateMany({
      where: { id: { in: order_ids } },
      data: { order_status },
    });

    await Promise.all(
      order_ids.map((id) =>
        searchQueue.add("update-order-batch", {
          type: "UPDATE_ORDER_STATUS",
          payload: {
            id,
            status: order_status,
          },
        })
      )
    );

    return result;
  }
  async getPaginatedShopOrders({
    shop_id,
    limit = 10,
    cursor,
    searchTerm,
    orderStatus,
    dateRange,
  }: GetPaginatedOrdersOptions): Promise<{
    orders: OrderWithDetails[];
    nextCursor?: string;
  }> {
    if (!searchTerm) {
      return this.getPaginatedShopOrdersFromDB({
        shop_id,
        limit,
        cursor,
        orderStatus,
        dateRange,
      });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mustQuery: any[] = [{ term: { shop_id } }];
      if (orderStatus) mustQuery.push({ term: { status: orderStatus } });
      if (dateRange) {
        mustQuery.push({
          range: { created_at: { gte: dateRange.from, lte: dateRange.to } },
        });
      }

      mustQuery.push({
        multi_match: {
          query: searchTerm,
          fields: ["display_id", "delivery_address", "user_email"],
          type: "phrase_prefix",
        },
      });

      let searchAfter: string[] | undefined;
      if (cursor) {
        try {
          searchAfter = JSON.parse(
            Buffer.from(cursor, "base64").toString("utf-8")
          );
        } catch {
          // If cursor is invalid/corrupted, start from page 1 safely
        }
      }

      const result = await elasticClient.search({
        index: INDICES.ORDERS,
        size: limit,
        query: { bool: { must: mustQuery } },
        track_total_hits: false,
        _source: false,
        sort: [{ created_at: "desc" }, { id: "desc" }],
        search_after: searchAfter,
      });

      const hits = result.hits.hits;
      if (hits.length === 0) return { orders: [] };

      const ids = hits.map((h) => h._id as string);
      const orders = await prisma.order.findMany({
        where: { id: { in: ids } },
        include: orderWithDetailsInclude,
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
      });

      let nextCursor: string | undefined;
      const lastHit = hits[hits.length - 1];

      if (hits.length === limit && lastHit?.sort) {
        nextCursor = Buffer.from(JSON.stringify(lastHit.sort)).toString(
          "base64"
        );
      }

      return { orders, nextCursor };
    } catch (error) {
      console.error("Search failed, falling back to DB", error);
      return this.getPaginatedShopOrdersFromDB({
        shop_id,
        limit,
        cursor,
        searchTerm,
        orderStatus,
        dateRange,
      });
    }
  }

  async getPaginatedShopOrdersFromDB({
    shop_id,
    limit = 10,
    cursor,
    searchTerm,
    orderStatus,
    dateRange,
  }: GetPaginatedOrdersOptions): Promise<{
    orders: OrderWithDetails[];
    nextCursor?: string;
  }> {
    const where: Prisma.OrderWhereInput = {
      shop_id,
    };

    if (orderStatus) {
      where.order_status = orderStatus;
    }

    if (dateRange) {
      where.created_at = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    if (searchTerm) {
      where.OR = [
        { display_id: { contains: searchTerm, mode: "insensitive" } },
        {
          delivery_address_snapshot: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.order.findMany({
      take: limit + 1,
      where,
      orderBy: { created_at: Prisma.SortOrder.desc },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: orderWithDetailsInclude,
    });

    let nextCursor: string | undefined = undefined;

    if (orders.length > limit) {
      const nextItem = orders.pop();
      nextCursor = nextItem?.id;
    }

    return { orders, nextCursor };
  }

  async findById(orderId: string): Promise<Order | null>;
  async findById<T extends OrderFindOptions>(
    orderId: string,
    options: T
  ): Promise<Prisma.OrderGetPayload<{ where: { id: string } } & T> | null>;
  async findById<T extends OrderFindOptions>(
    orderId: string,
    options?: T
  ): Promise<
    Prisma.OrderGetPayload<{ where: { id: string } } & T> | Order | null
  > {
    const query = { where: { id: orderId }, ...(options ?? {}) };
    return prisma.order.findUnique(query);
  }

  async findMany<T extends Prisma.OrderFindManyArgs>(
    options: T
  ): Promise<Prisma.OrderGetPayload<T>[]>;
  async findMany<T extends Prisma.OrderFindManyArgs>(
    options: T
  ): Promise<Order[]> {
    return prisma.order.findMany(options);
  }

  async update(orderId: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({
      where: { id: orderId },
      data,
    });
  }

  async count(where?: Prisma.OrderWhereInput): Promise<number> {
    return prisma.order.count({ where });
  }
}

export const orderRepository = new OrderRepository();

export default orderRepository;
