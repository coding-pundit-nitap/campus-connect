import { PaymentMethod, Prisma } from "@/generated/client";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { orderWithDetailsInclude } from "@/lib/utils/order.utils";
import { APP_TIME_ZONE, getZonedParts } from "@/lib/utils/timezone";
import { getShopOrderUrl } from "@/lib/utils/url.utils";
import orderRepository from "@/repositories/order.repository";
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
    const result = await tx.$queryRaw<{ next_id: bigint }[]>`
      SELECT nextval('order_display_id_seq') as next_id
    `;
    const nextId = result[0].next_id.toString();
    return `NITAP-${nextId.padStart(6, "0")}`;
  }

  private normalizeToMinute(date: Date): Date {
    const normalized = new Date(date);
    normalized.setSeconds(0);
    normalized.setMilliseconds(0);
    return normalized;
  }

  private async getActiveBatchSlots(
    tx: Prisma.TransactionClient,
    shop_id: string
  ): Promise<
    { id: string; cutoff_time_minutes: number; sort_order: number }[]
  > {
    try {
      return await tx.batchSlot.findMany({
        where: { shop_id, is_active: true },
        select: { id: true, cutoff_time_minutes: true, sort_order: true },
        orderBy: [{ sort_order: "asc" }, { cutoff_time_minutes: "asc" }],
      });
    } catch {
      return [];
    }
  }

  private async findOrCreateBatchForRequestedTime(
    tx: Prisma.TransactionClient,
    shop_id: string,
    requested_delivery_time: Date
  ) {
    const now = new Date();
    const cutoffTime = this.normalizeToMinute(requested_delivery_time);

    if (cutoffTime.getTime() <= now.getTime()) {
      throw new ValidationError("Selected batch slot is in the past");
    }

    const activeSlots = await this.getActiveBatchSlots(tx, shop_id);
    if (activeSlots.length === 0) {
      throw new ValidationError(
        "This shop has no batch cards configured. Use direct delivery instead."
      );
    }

    const cutoffZoned = getZonedParts(cutoffTime, APP_TIME_ZONE);
    const minutesFromMidnight = cutoffZoned.hour * 60 + cutoffZoned.minute;
    const matchingSlot = activeSlots.find(
      (s) => s.cutoff_time_minutes === minutesFromMidnight
    );

    if (!matchingSlot) {
      throw new ValidationError("Selected batch slot is not available");
    }

    const existingBatch = await tx.batch.findFirst({
      where: {
        shop_id,
        cutoff_time: cutoffTime,
        status: { in: ["OPEN", "LOCKED", "IN_TRANSIT", "COMPLETED"] },
      },
      select: { id: true, status: true },
    });

    if (existingBatch && existingBatch.status !== "OPEN") {
      throw new ValidationError(
        "This batch has already been locked. Please pick another slot or use direct delivery."
      );
    }

    if (existingBatch) {
      return await tx.batch.findUnique({ where: { id: existingBatch.id } });
    }

    return await tx.batch.create({
      data: {
        shop_id,
        cutoff_time: cutoffTime,
        status: "OPEN",
        slot_id: matchingSlot.id,
      },
    });
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
      total_pages: Math.ceil(totalOrders / limit),
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

      const shop = await tx.shop.findUnique({
        where: { id: shop_id },
        select: {
          id: true,
          name: true,
          min_order_value: true,
          default_delivery_fee: true,
          default_platform_fee: true,
          user: { select: { id: true } },
        },
      });

      const deliveryAddress = await tx.userAddress.findUnique({
        where: { id: delivery_address_id },
      });

      if (!cart || cart.items.length === 0) {
        throw new NotFoundError("Cart is empty.");
      }
      if (!shop) {
        throw new NotFoundError("Shop not found.");
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

      let itemTotalPaise = 0;
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
        itemTotalPaise += discountedPricePaise * item.quantity;
      }
      const itemTotal = Math.round(itemTotalPaise) / 100;
      const minOrderValue = Number(shop.min_order_value);
      if (itemTotal < minOrderValue) {
        throw new ValidationError(
          `Minimum order value is ₹${minOrderValue}. Your cart total is ₹${itemTotal}.`
        );
      }

      const deliveryFee = Number(shop.default_delivery_fee) || 0;
      const platformFee = Number(shop.default_platform_fee) || 0;
      const totalPrice = itemTotal + deliveryFee + platformFee;

      const delivery_address_snapshot = `${deliveryAddress.building}, Room ${deliveryAddress.room_number}${deliveryAddress.notes ? ` (${deliveryAddress.notes})` : ""}`;

      const display_id = await this.generateDisplayId(tx);

      const batch = requested_delivery_time
        ? await this.findOrCreateBatchForRequestedTime(
            tx,
            shop_id,
            requested_delivery_time
          )
        : null;

      const order = await tx.order.create({
        data: {
          display_id,
          user_id: user_id,
          shop_id: shop_id,
          ...(batch ? { batch_id: batch.id } : {}),
          item_total: itemTotal,
          delivery_fee: deliveryFee,
          platform_fee: platformFee,
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

      if (shop.user) {
        try {
          await notificationService.publishNotification(shop.user.id, {
            title: "New Order Received",
            message: `You have received a new order with ID: ${order.display_id}`,
            action_url: getShopOrderUrl(order.id),
            type: "INFO",
          });
        } catch (error) {
          console.error("Notification Error:", error);
        }
      }

      return order;
    });
  }
}

export const orderService = new OrderService();
export default orderService;
