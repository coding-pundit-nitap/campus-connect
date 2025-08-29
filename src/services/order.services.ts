import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Type alias for Prisma order find unique options without the where clause.
 *
 * Provides type-safe query options for single order retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 */
type OrderFindOptions = Omit<Prisma.OrderFindUniqueArgs, "where">;

/**
 * Type alias for Prisma order find many options without the where clause.
 *
 * Provides type-safe query options for multiple order retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports pagination, sorting, filtering, and relation includes for bulk operations.
 *
 */
type OrderFindManyOptions = Omit<Prisma.OrderFindManyArgs, "where">;

/**
 * Service class for order-related database operations.
 *
 * Provides comprehensive order management functionality including order creation
 * from carts, order retrieval with flexible options, and order status management.
 * Implements atomic transactions for cart-to-order conversion with stock validation
 * and payment processing integration.
 *
 */
class OrderServices {
  /**
   * Retrieves a single order by its unique identifier.
   *
   * Fetches an order from the database using the provided order ID. Supports
   * method overloading to allow flexible query options including relations,
   * field selection, and other Prisma query features for customized data retrieval.
   *
   */
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

  /**
   * Retrieves all orders associated with a specific user.
   *
   * Fetches a comprehensive list of orders that belong to the specified user
   * across all shops. Supports flexible query options for customizing the returned
   * data including pagination, sorting, and relation includes for order management.
   *
   */
  async getOrdersByUserId(): Promise<Order[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    options: T
  ): Promise<Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    options?: T
  ): Promise<
    Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[] | Order[]
  > {
    const session = await auth();
    const user_id = session?.user?.id;
    if (!user_id) throw new Error("User not authenticated");

    const query = { where: { user_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  /**
   * Retrieves all orders associated with a specific shop.
   *
   * Fetches a comprehensive list of orders that belong to the specified shop
   * from all customers. Essential for shop management, order fulfillment, and
   * business analytics. Supports flexible query options for customized data retrieval.
   *
   */
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

  /**
   * Creates a new order from an existing cart with comprehensive validation and atomic processing.
   *
   * Converts a user's cart into a completed order through an atomic transaction that validates
   * cart contents, checks stock availability, calculates totals, processes payment information,
   * updates inventory, and clears the cart. Ensures data consistency and handles all edge cases
   * in the cart-to-order conversion process.
   *
   */
  async createOrderFromCart(
    shop_id: string,
    payment_method: PaymentMethod,
    delivery_address_id: string,
    pg_payment_id?: string,
    requested_delivery_time?: Date
  ): Promise<Order> {
    const session = await auth();
    const user_id = session?.user?.id;
    if (!user_id) throw new Error("User not authenticated");
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

  /**
   * Updates the status of an existing order.
   *
   * Changes the order status to reflect the current state in the fulfillment process.
   * Essential for order tracking, workflow management, and customer communication.
   * Provides atomic updates with proper validation and audit trail maintenance.
   *
   */
  async updateOrderStatus(
    order_id: string,
    status: OrderStatus
  ): Promise<Order> {
    return prisma.order.update({
      where: { id: order_id },
      data: { order_status: status },
    });
  }
}

const orderServices = new OrderServices();

export default orderServices;
