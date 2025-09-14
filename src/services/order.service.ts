import { PaymentMethod } from "@prisma/client";

import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";

class OrderService {
  async createOrderFromCart(
    user_id: string,
    shop_id: string,
    payment_method: PaymentMethod,
    delivery_address_id: string,
    pg_payment_id?: string,
    requested_delivery_time?: Date
  ) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
        include: { items: { include: { product: true } } },
      });

      const deliveryAddress = await tx.userAddress.findUnique({
        where: { id: delivery_address_id },
      });

      if (!cart || cart.items.length === 0)
        throw new NotFoundError("Cart is empty.");
      if (!deliveryAddress)
        throw new NotFoundError("Delivery address not found.");
      if (deliveryAddress.user_id !== user_id)
        throw new UnauthorizedError("Address does not belong to user.");

      let totalPrice = 0;
      for (const item of cart.items) {
        if (item.product.stock_quantity < item.quantity) {
          throw new ValidationError(
            `Insufficient stock for: ${item.product.name}`
          );
        }
        totalPrice += Number(item.product.price) * item.quantity;
      }
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
        cart.items.map((item) =>
          tx.product.update({
            where: { id: item.product_id },
            data: { stock_quantity: { decrement: item.quantity } },
          })
        )
      );
      await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });

      return order;
    });
  }
}

export const orderService = new OrderService();
export default orderService;
