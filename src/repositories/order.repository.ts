import { Order, OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
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
    return db.order.create({ data });
  }

  async updateStatus(
    order_id: string,
    order_status: OrderStatus,
    assigned_to?: string,
    actual_delivery_time?: Date
  ): Promise<Order> {
    return prisma.order.update({
      where: { id: order_id },
      data: {
        order_status,
        assigned_to,
        actual_delivery_time,
      },
    });
  }

  async batchUpdateStatus(
    order_ids: string[],
    order_status: OrderStatus
  ): Promise<Prisma.BatchPayload> {
    return prisma.order.updateMany({
      where: { id: { in: order_ids } },
      data: { order_status },
    });
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
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
        user: true,
        shop: true,
        delivery_address: true,
      },
    });

    let nextCursor: string | undefined = undefined;

    if (orders.length > limit) {
      const nextItem = orders.pop();
      nextCursor = nextItem?.id;
    }

    return { orders, nextCursor };
  }
}

export const orderRepository = new OrderRepository();

export default orderRepository;
