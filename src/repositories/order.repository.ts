import { Order, OrderStatus, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";
import { orderWithDetailsInclude } from "@/lib/utils/order.utils";
import { OrderWithDetails } from "@/types";

import { BaseRepository } from "./base.repository";

type GetPaginatedOrdersOptions = {
  shop_id: string;
  limit?: number;
  cursor?: string;
  searchTerm?: string;
  orderStatus?: OrderStatus;
  dateRange?: { from: Date; to: Date };
  hostelBlock?: string;
};

export class OrderRepository extends BaseRepository<
  Order,
  Prisma.OrderFindUniqueArgs,
  Prisma.OrderFindManyArgs,
  Prisma.OrderCreateArgs,
  Prisma.OrderUpdateArgs,
  Prisma.OrderDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.order);
  }

  async getOrderById(order_id: string): Promise<Order | null>;
  async getOrderById<T extends Omit<Prisma.OrderFindUniqueArgs, "where">>(
    order_id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.OrderDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async getOrderById(
    order_id: string,
    options?: Omit<Prisma.OrderFindUniqueArgs, "where">
  ): Promise<
    | Order
    | null
    | Prisma.Result<
        Prisma.OrderDelegate,
        Omit<Prisma.OrderFindUniqueArgs, "where"> & { where: { id: string } },
        "findUnique"
      >
  > {
    return this.prismaClient.order.findUnique({
      where: { id: order_id },
      ...options,
    });
  }

  async getOrdersByUserId(user_id: string): Promise<Order[]>;
  async getOrdersByUserId<T extends Omit<Prisma.OrderFindManyArgs, "where">>(
    user_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.OrderDelegate,
      T & { where: { user_id: string } },
      "findMany"
    >
  >;
  async getOrdersByUserId(
    user_id: string,
    options?: Omit<Prisma.OrderFindManyArgs, "where">
  ): Promise<
    | Order[]
    | Prisma.Result<
        Prisma.OrderDelegate,
        Omit<Prisma.OrderFindManyArgs, "where"> & {
          where: { user_id: string };
        },
        "findMany"
      >
  > {
    return this.prismaClient.order.findMany({
      where: { user_id },
      ...options,
    });
  }

  async getOrdersByShopId(shop_id: string): Promise<Order[]>;
  async getOrdersByShopId<T extends Omit<Prisma.OrderFindManyArgs, "where">>(
    shop_id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.OrderDelegate,
      T & { where: { shop_id: string } },
      "findMany"
    >
  >;
  async getOrdersByShopId(
    shop_id: string,
    options?: Omit<Prisma.OrderFindManyArgs, "where">
  ): Promise<
    | Order[]
    | Prisma.Result<
        Prisma.OrderDelegate,
        Omit<Prisma.OrderFindManyArgs, "where"> & {
          where: { shop_id: string };
        },
        "findMany"
      >
  > {
    return this.prismaClient.order.findMany({
      where: { shop_id },
      ...options,
    });
  }

  async getOrdersByIds(order_ids: string[]): Promise<Order[]>;
  async getOrdersByIds<T extends Omit<Prisma.OrderFindManyArgs, "where">>(
    order_ids: string[],
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.OrderDelegate,
      T & { where: { id: { in: string[] } } },
      "findMany"
    >
  >;
  async getOrdersByIds(
    order_ids: string[],
    options?: Omit<Prisma.OrderFindManyArgs, "where">
  ): Promise<
    | Order[]
    | Prisma.Result<
        Prisma.OrderDelegate,
        Omit<Prisma.OrderFindManyArgs, "where"> & {
          where: { id: { in: string[] } };
        },
        "findMany"
      >
  > {
    return this.prismaClient.order.findMany({
      where: { id: { in: order_ids } },
      ...options,
    });
  }

  async create<T extends Prisma.OrderCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.OrderDelegate, T, "create">>;
  override async create(args: Prisma.OrderCreateArgs): Promise<Order>;
  async create(
    data: Prisma.OrderCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Order>;
  override async create(
    argsOrData: Prisma.OrderCreateArgs | Prisma.OrderCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<
    | Order
    | Prisma.Result<Prisma.OrderDelegate, Prisma.OrderCreateArgs, "create">
  > {
    if (argsOrData && "data" in argsOrData) {
      return this.prismaClient.order.create(argsOrData);
    }
    const db = tx || this.prismaClient;
    const order = await db.order.create({
      data: argsOrData as Prisma.OrderCreateInput,
    });

    if (!order.user_id) {
      throw new Error("Order must have a user_id to be indexed.");
    }

    return order;
  }

  async update<T extends Prisma.OrderUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.OrderDelegate, T, "update">>;
  override async update(args: Prisma.OrderUpdateArgs): Promise<Order>;
  async update<T extends Omit<Prisma.OrderUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.OrderUpdateInput,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.OrderDelegate,
      T & { where: { id: string }; data: Prisma.OrderUpdateInput },
      "update"
    >
  >;
  override async update(
    idOrArgs: string | Prisma.OrderUpdateArgs,
    data?: Prisma.OrderUpdateInput,
    options?: Omit<Prisma.OrderUpdateArgs, "where" | "data">
  ): Promise<
    | Order
    | Prisma.Result<Prisma.OrderDelegate, Prisma.OrderUpdateArgs, "update">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.order.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.order.update(idOrArgs);
  }

  async updateStatus(
    order_id: string,
    order_status: OrderStatus,
    assigned_to?: string,
    actual_delivery_time?: Date
  ): Promise<Order> {
    const order = await this.prismaClient.order.update({
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
    const result = await this.prismaClient.order.updateMany({
      where: { id: { in: order_ids } },
      data: { order_status },
    });

    return result;
  }

  async batchUpdateOrders(
    order_ids: string[],
    data: Prisma.OrderUpdateManyMutationInput
  ): Promise<Prisma.BatchPayload> {
    const result = await this.prismaClient.order.updateMany({
      where: { id: { in: order_ids } },
      data,
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
    hostelBlock,
  }: GetPaginatedOrdersOptions): Promise<{
    orders: OrderWithDetails[];
    nextCursor?: string;
  }> {
    return this.getPaginatedShopOrdersFromDB({
      shop_id,
      limit,
      cursor,
      searchTerm,
      orderStatus,
      dateRange,
      hostelBlock,
    });
  }

  async getPaginatedShopOrdersFromDB({
    shop_id,
    limit = 10,
    cursor,
    searchTerm,
    orderStatus,
    dateRange,
    hostelBlock,
  }: GetPaginatedOrdersOptions): Promise<{
    orders: OrderWithDetails[];
    nextCursor?: string;
  }> {
    const where: Prisma.OrderWhereInput = {
      shop_id,
    };

    if (hostelBlock) {
      where.delivery_address_snapshot = {
        string_contains: hostelBlock,
        mode: "insensitive",
      };
    }

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
            string_contains: searchTerm,
            mode: "insensitive",
          },
        },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const orders = await this.prismaClient.order.findMany({
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
  async findById<T extends Omit<Prisma.OrderFindUniqueArgs, "where">>(
    orderId: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.OrderDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    orderId: string,
    options?: Omit<Prisma.OrderFindUniqueArgs, "where">
  ): Promise<
    | Order
    | null
    | Prisma.Result<
        Prisma.OrderDelegate,
        Omit<Prisma.OrderFindUniqueArgs, "where"> & { where: { id: string } },
        "findUnique"
      >
  > {
    const query = { where: { id: orderId }, ...(options ?? {}) };
    return this.prismaClient.order.findUnique(query);
  }

  async findMany<T extends Prisma.OrderFindManyArgs>(
    options: T
  ): Promise<Prisma.Result<Prisma.OrderDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.OrderFindManyArgs): Promise<Order[]>;
  override async findMany(
    argsOrOptions?: Prisma.OrderFindManyArgs
  ): Promise<
    | Order[]
    | Prisma.Result<Prisma.OrderDelegate, Prisma.OrderFindManyArgs, "findMany">
  > {
    return this.prismaClient.order.findMany(argsOrOptions);
  }

  async count(args?: Prisma.OrderCountArgs): Promise<number> {
    return this.prismaClient.order.count(args);
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
