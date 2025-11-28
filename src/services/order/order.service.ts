import { PaymentMethod } from "@prisma/client";

import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
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
    upi_transaction_id?: string
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

      let totalPrice = 0;
      for (const item of cart.items) {
        if (item.product.stock_quantity < item.quantity) {
          throw new ValidationError(
            `Insufficient stock for: ${item.product.name}`
          );
        }
        const price = Number(item.product.price) * 100;
        const discount = Number(item.product.discount) || 0;
        const discountedPrice = Math.round(price - (price * discount) / 100);
        totalPrice += discountedPrice * item.quantity;
      }
      totalPrice = totalPrice / 100;
      const delivery_address_snapshot = `${deliveryAddress.building}, Room ${deliveryAddress.room_number}${deliveryAddress.notes ? ` (${deliveryAddress.notes})` : ""}`;

      const order = await tx.order.create({
        data: {
          display_id: `NITAP-${Date.now().toString().slice(-6)}`,
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
        await notificationService.publishNotification(shop.user.id, {
          title: "New Order Received",
          message: `You have received a new order with ID: ${order.display_id}`,
          action_url: getShopOrderUrl(order.id),
          type: "INFO",
        });
      }

      return order;
    });
  }
}

export const orderService = new OrderService();
export default orderService;
