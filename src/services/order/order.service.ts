import { PaymentMethod, Prisma } from "@prisma/client";

import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { loggers } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { orderWithDetailsInclude } from "@/lib/utils/order.utils";
import { getShopOrderUrl } from "@/lib/utils/url.utils";
import orderRepository from "@/repositories/order.repository";
import { shopRepository } from "@/repositories/shop.repository";
import { notificationService } from "@/services/notification/notification.service";

type GetOrdersOptions = {
  page?: number;
  limit?: number;
  userId: string;
};

class OrderService {
  private async generateDisplayId(
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const counter = await tx.globalCounter.update({
      where: { id: "GLOBAL" },
      data: { order_count: { increment: 1 } },
    });
    return `NITAP-${counter.order_count.toString().padStart(6, "0")}`;
  }

  async getOrders(options: GetOrdersOptions) {
    const { page = 1, limit = 10, userId } = options;
    const skip = (page - 1) * limit;

    const orders = await orderRepository.getOrdersByUserId(userId, {
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      include: orderWithDetailsInclude,
    });

    const totalOrders = await prisma.order.count({
      where: { user_id: userId },
    });

    return {
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    };
  }

  async createOrderFromCart(
    user_id: string,
    shop_id: string,
    payment_method: PaymentMethod,
    delivery_address_id: string,
    pg_payment_id?: string,
    requested_delivery_time?: Date,
    upi_transaction_id?: string,
    customer_notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
        include: {
          items: { include: { product: true } },
          user: { select: { name: true, phone: true } },
        },
      });

      const deliveryAddress = await tx.userAddress.findUnique({
        where: { id: delivery_address_id },
      });

      if (!cart || cart.items.length === 0) {
        throw new NotFoundError("Cart is empty.");
      }
      if (!deliveryAddress) {
        throw new NotFoundError("Delivery address not found.");
      }
      if (deliveryAddress.user_id !== user_id) {
        throw new UnauthorizedError("Address does not belong to user.");
      }

      const productIds = cart.items.map((item) => item.product_id);
      await tx.$executeRaw`
        SELECT id FROM "Product" 
        WHERE id = ANY(${productIds}::text[])
        FOR UPDATE
      `;

      let totalPricePaise = 0;
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          select: { stock_quantity: true, name: true },
        });

        if (!product || product.stock_quantity < item.quantity) {
          throw new ValidationError(
            `Insufficient stock for: ${item.product.name}`
          );
        }
        const pricePaise = Math.round(Number(item.product.price) * 100);
        const discountPercent = Number(item.product.discount) || 0;
        const discountPaise = Math.round((pricePaise * discountPercent) / 100);
        const discountedPricePaise = pricePaise - discountPaise;
        totalPricePaise += discountedPricePaise * item.quantity;
      }
      const totalPrice = Math.round(totalPricePaise) / 100;

      const delivery_address_snapshot = `${deliveryAddress.building}, Room ${deliveryAddress.room_number}${deliveryAddress.notes ? ` (${deliveryAddress.notes})` : ""}`;

      const display_id = await this.generateDisplayId(tx);

      const order = await tx.order.create({
        data: {
          display_id,
          user_id: user_id,
          shop_id: shop_id,
          total_price: totalPrice,
          payment_method,
          payment_status: payment_method === "ONLINE" ? "COMPLETED" : "PENDING",
          pg_payment_id,
          upi_transaction_id,
          delivery_address_id,
          delivery_address_snapshot,
          requested_delivery_time,
          customer_notes,
          items: {
            create: cart.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      await Promise.all(
        cart.items.map(async (item) => {
          const result = await tx.product.updateMany({
            where: {
              id: item.product_id,
              stock_quantity: { gte: item.quantity },
            },
            data: { stock_quantity: { decrement: item.quantity } },
          });

          if (result.count === 0) {
            throw new ValidationError(
              `Insufficient stock for: ${item.product.name}`
            );
          }
        })
      );

      await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });

      const shop = await shopRepository.findById(shop_id, {
        include: { user: { select: { id: true } } },
      });

      if (shop && shop.user) {
        try {
          await notificationService.publishNotification(shop.user.id, {
            title: "New Order Received",
            message: `You have received a new order with ID: ${order.display_id}`,
            action_url: getShopOrderUrl(order.id),
            type: "INFO",
          });
        } catch (error) {
          loggers.order.warn(
            {
              err: error,
              orderId: order.id,
              shopId: shop_id,
              shopOwnerId: shop.user.id,
            },
            "Failed to send new order notification to shop owner. Order was created successfully but shop owner may not have been notified."
          );
        }
      }

      return order;
    });
  }
}

export const orderService = new OrderService();
export default orderService;
