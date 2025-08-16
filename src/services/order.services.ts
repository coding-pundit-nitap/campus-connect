import {
  Prisma,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import CartServices from "./cart.services";

type OrderFindOptions = Omit<Prisma.OrderFindUniqueArgs, "where">;
type OrderFindManyOptions = Omit<Prisma.OrderFindManyArgs, "where">;

class OrderServices {
  async getOrderById(order_id: string): Promise<Order | null>;
  async getOrderById<T extends OrderFindOptions>(
    order_id: string,
    options: T,
  ): Promise<Prisma.OrderGetPayload<{ where: { id: string } } & T> | null>;
  async getOrderById<T extends OrderFindOptions>(
    order_id: string,
    options?: T,
  ): Promise<
    Prisma.OrderGetPayload<{ where: { id: string } } & T> | Order | null
  > {
    const query = { where: { id: order_id }, ...(options ?? {}) };
    return prisma.order.findUnique(query);
  }

  async getOrdersByUserId(user_id: string): Promise<Order[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    user_id: string,
    options: T,
  ): Promise<Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    user_id: string,
    options?: T,
  ): Promise<
    Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[] | Order[]
  > {
    const query = { where: { user_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  async getOrdersByShopId(shop_id: string): Promise<Order[]>;
  async getOrdersByShopId<T extends OrderFindManyOptions>(
    shop_id: string,
    options: T,
  ): Promise<Prisma.OrderGetPayload<{ where: { shop_id: string } } & T>[]>;
  async getOrdersByShopId<T extends OrderFindManyOptions>(
    shop_id: string,
    options?: T,
  ): Promise<
    Prisma.OrderGetPayload<{ where: { shop_id: string } } & T>[] | Order[]
  > {
    const query = { where: { shop_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  async createOrderFromCart(
    user_id: string,
    shop_id: string,
    payment_method: PaymentMethod,
    pg_payment_id?: string,
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
      for (const item of cart.items) {
        if (item.product.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for product: ${item.product.name}`,
          );
        }
      }
      const totalPrice = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

      const order = await tx.order.create({
        data: {
          user_id,
          shop_id,
          total_price: totalPrice,
          payment_method,
          payment_status:
            payment_method === PaymentMethod.ONLINE
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PENDING,
          pg_payment_id,
          items: {
            create: cart.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
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
        }),
      );
      await Promise.all(stockUpdatePromises);
      await tx.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });

      return order;
    });
  }

  async updateOrderStatus(
    order_id: string,
    status: OrderStatus,
  ): Promise<Order> {
    return prisma.order.update({
      where: { id: order_id },
      data: { order_status: status },
    });
  }
}

const orderServices = new OrderServices();

export default orderServices;
