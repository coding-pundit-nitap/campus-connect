import { Order, OrderStatus, Prisma } from "@/../prisma/generated/client";
import { prisma } from "@/lib/prisma";
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

    // Use Prisma for search instead of Elasticsearch
    const where: any = { shop_id };
    if (orderStatus) where.order_status = orderStatus;
    if (dateRange) {
      where.created_at = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }
    if (searchTerm) {
      where.OR = [
        { display_id: { contains: searchTerm, mode: "insensitive" } },
        { delivery_address_snapshot: { contains: searchTerm, mode: "insensitive" } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    let cursorCondition: any = {};
    if (cursor) {
      try {
        const cursorData = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf-8")
        );
        cursorCondition = {
          OR: [
            { created_at: { lt: new Date(cursorData[0]) } },
            {
              AND: [
                { created_at: { equals: new Date(cursorData[0]) } },
                { id: { lt: cursorData[1] } },
              ],
            },
          ],
        };
      } catch {
        // If cursor is invalid, ignore it
      }
    }

    const orders = await prisma.order.findMany({
      where: { ...where, ...cursorCondition },
      include: orderWithDetailsInclude,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: limit + 1, // Take one extra to check if there are more
    });

    let nextCursor: string | undefined;
    if (orders.length > limit) {
      const lastOrder = orders[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify([lastOrder.created_at.toISOString(), lastOrder.id])
      ).toString("base64");
      orders.pop(); // Remove the extra item
    }

    return { orders, nextCursor };
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
