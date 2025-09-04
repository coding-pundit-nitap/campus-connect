import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type OrderFindOptions = Omit<Prisma.OrderFindUniqueArgs, "where">;

type OrderFindManyOptions = Omit<Prisma.OrderFindManyArgs, "where">;

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

  async create(
    user_id: string,
    shop_id: string,
    payment_method: PaymentMethod,
    delivery_address_id: string,
    pg_payment_id?: string,
    requested_delivery_time?: Date
  ): Promise<Order> {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { user_id_shop_id: { user_id, shop_id } },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cannot create an order from an empty cart.");
      }
      cart.items.forEach((item) => {
        if (item.product.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for product: ${item.product.name}`
          );
        }
      });
      const total_price = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

      const deliveryAddress = await tx.userAddress.findUnique({
        where: { id: delivery_address_id },
      });

      if (!deliveryAddress) {
        throw new Error("Selected delivery address not found.");
      }
      if (deliveryAddress.user_id !== user_id) {
        throw new Error(
          "Unauthorized: Delivery address does not belong to this user."
        );
      }

      let delivery_address_snapshot = `${deliveryAddress.building}, Room ${deliveryAddress.room_number}`;
      if (deliveryAddress.notes) {
        delivery_address_snapshot += ` (${deliveryAddress.notes})`;
      }
      const order = await tx.order.create({
        data: {
          user_id,
          shop_id,
          total_price,
          payment_method,
          payment_status:
            payment_method === PaymentMethod.ONLINE
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PENDING,
          pg_payment_id,
          delivery_address_id,
          requested_delivery_time,
          items: {
            create: cart.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
          display_id: `NITAP-${Date.now().toString().slice(-6)}`,
          delivery_address_snapshot,
        },
        include: { items: true },
      });

      const stockUpdatePromises = cart.items.map((item) =>
        tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        })
      );
      await Promise.all(stockUpdatePromises);
      await tx.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });

      return order;
    });
  }

  async updateStatus(order_id: string, status: OrderStatus): Promise<Order> {
    return prisma.order.update({
      where: { id: order_id },
      data: { order_status: status },
    });
  }
}

export const orderRepository = new OrderRepository();

export default orderRepository;
