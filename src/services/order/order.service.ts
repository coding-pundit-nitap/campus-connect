import { PaymentMethod, Prisma } from "@/generated/client";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { orderWithDetailsInclude } from "@/lib/utils/order.utils";
import { APP_TIME_ZONE, getZonedParts } from "@/lib/utils/timezone";
import { getShopOrderUrl } from "@/lib/utils/url.utils";
import { OrderRepository } from "@/repositories/order.repository";
import { PlatformSettingsRepository } from "@/repositories/platform-settings.repository";
import { NotificationService } from "@/services/notification/notification.service";
import { DeliveryAddressSnapshot } from "@/types";
const log = createLogger("order.service");

/** Shape of rows returned by raw Batch lock queries */
type BatchQueryRow = {
  id: string;
  status: string;
  cutoff_time: string | Date;
};

type GetOrdersOptions = {
  page?: number;
  limit?: number;
  userId: string;
};

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly platformSettingsRepository: PlatformSettingsRepository,
    private readonly notificationService: NotificationService,
    private readonly prismaClient: typeof prisma = prisma
  ) {}
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
      },
      select: { id: true, status: true },
    });

    if (existingBatch) {
      if (existingBatch.status === "CANCELLED") {
        throw new ValidationError(
          "This batch slot is no longer available (Cancelled)."
        );
      }
      if (existingBatch.status !== "OPEN") {
        throw new ValidationError(
          "This batch has already been locked. Please pick another slot or use direct delivery."
        );
      }

      const lockedBatch = await tx.$queryRaw<BatchQueryRow[]>`
        SELECT id, status, cutoff_time FROM "Batch" WHERE id = ${existingBatch.id} FOR UPDATE
      `;
      if (!lockedBatch || lockedBatch.length === 0) {
        throw new ValidationError("The selected batch does not exist.");
      }
      if (lockedBatch[0].status === "CANCELLED") {
        throw new ValidationError(
          "This batch slot is no longer available (Cancelled)."
        );
      }
      if (lockedBatch[0].status !== "OPEN") {
        throw new ValidationError(
          "This batch has already been locked. Please pick another slot or use direct delivery."
        );
      }
      return {
        id: lockedBatch[0].id,
        cutoff_time: new Date(lockedBatch[0].cutoff_time),
        status: lockedBatch[0].status,
      };
    }

    try {
      return await tx.batch.create({
        data: {
          shop_id,
          cutoff_time: cutoffTime,
          status: "OPEN",
          slot_id: matchingSlot.id,
        },
      });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        (err as { code?: string }).code === "P2002"
      ) {
        const lockedBatch = await tx.$queryRaw<BatchQueryRow[]>`
          SELECT id, status, cutoff_time FROM "Batch" 
          WHERE shop_id = ${shop_id} AND cutoff_time = ${cutoffTime} FOR UPDATE
        `;
        if (!lockedBatch || lockedBatch.length === 0) {
          throw new ValidationError("The selected batch does not exist.");
        }
        if (lockedBatch[0].status !== "OPEN") {
          throw new ValidationError(
            "This batch has already been locked. Please pick another slot or use direct delivery."
          );
        }
        return {
          id: lockedBatch[0].id,
          cutoff_time: new Date(lockedBatch[0].cutoff_time),
          status: lockedBatch[0].status,
        };
      }
      throw err;
    }
  }

  async getOrders(options: GetOrdersOptions) {
    const { page = 1, limit = 10, userId } = options;
    const skip = (page - 1) * limit;

    const orders = await this.orderRepository.getOrdersByUserId(userId, {
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      include: orderWithDetailsInclude,
    });

    const totalOrders = await this.orderRepository.count({
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
    customer_notes?: string,
    is_direct_delivery?: boolean,
    batch_id?: string
  ) {
    if (is_direct_delivery && (batch_id || requested_delivery_time)) {
      throw new ValidationError(
        "Direct delivery orders cannot be scheduled or assigned to a batch."
      );
    }
    if (!is_direct_delivery && !batch_id && !requested_delivery_time) {
      throw new ValidationError(
        "Batch delivery orders must specify a batch ID or requested delivery time."
      );
    }
    if (!is_direct_delivery && batch_id && requested_delivery_time) {
      throw new ValidationError(
        "Provide either batch ID or requested delivery time, not both."
      );
    }
    const { order, shopOwnerId } = await this.prismaClient.$transaction(
      async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
          include: {
            items: { include: { product: true } },
            user: { select: { name: true, phone: true } },
          },
        });

        const shop = await tx.shop.findFirst({
          where: { id: shop_id, deleted_at: null },
          select: {
            id: true,
            name: true,
            is_active: true,
            accepting_orders: true,
            min_order_value: true,
            default_delivery_fee: true,
            direct_delivery_fee: true,
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
        if (!shop.is_active) {
          throw new ValidationError("Shop is currently not accepting orders.");
        }
        if (!shop.accepting_orders) {
          throw new ValidationError(
            "Shop is not accepting orders at the moment. Please try again later."
          );
        }
        if (!deliveryAddress) {
          throw new NotFoundError("Delivery address not found.");
        }
        if (deliveryAddress.user_id !== user_id) {
          throw new UnauthorizedError("Address does not belong to user.");
        }

        const configuredDeliveryBuildings = await tx.shopDeliveryBuilding.count(
          {
            where: { shop_id, is_active: true },
          }
        );
        if (configuredDeliveryBuildings > 0) {
          const canDeliver = deliveryAddress.building_id
            ? await tx.shopDeliveryBuilding.findFirst({
                where: {
                  shop_id,
                  building_id: deliveryAddress.building_id,
                  is_active: true,
                },
                select: { id: true },
              })
            : await tx.shopDeliveryBuilding.findFirst({
                where: {
                  shop_id,
                  is_active: true,
                  building: {
                    name: {
                      equals: deliveryAddress.building,
                      mode: "insensitive",
                    },
                  },
                },
                select: { id: true },
              });

          if (!canDeliver) {
            throw new ValidationError(
              "This shop does not deliver to the selected building."
            );
          }
        }

        const productIds = [
          ...new Set(cart.items.map((item) => item.product_id)),
        ].sort();
        await tx.$queryRaw`
          SELECT id FROM "Product" 
          WHERE id = ANY(${productIds}::text[])
          ORDER BY id
          FOR UPDATE
        `;

        const productDetailsMap = new Map<
          string,
          { price: number; name: string }
        >();

        let itemTotalPaise = 0;
        for (const item of cart.items) {
          const product = await tx.product.findUnique({
            where: { id: item.product_id },
            select: {
              stock_quantity: true,
              name: true,
              price: true,
              discount: true,
              deleted_at: true,
            },
          });

          if (!product || product.deleted_at) {
            throw new ValidationError(
              `Product ${product?.name || "Unknown"} is no longer available.`
            );
          }
          if (item.quantity <= 0) {
            throw new ValidationError(
              `Invalid quantity for product: ${product.name}`
            );
          }
          if (product.stock_quantity < item.quantity) {
            throw new ValidationError(
              `Insufficient stock for: ${product.name}`
            );
          }

          const pricePaise = Math.round(Number(product.price) * 100);
          const discountPercent = Number(product.discount) || 0;
          const discountPaise = Math.round(
            (pricePaise * discountPercent) / 100
          );
          const discountedPrice = (pricePaise - discountPaise) / 100;

          productDetailsMap.set(item.product_id, {
            price: discountedPrice,
            name: product.name,
          });

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

        const deliveryFee = is_direct_delivery
          ? Number(shop.direct_delivery_fee) || 0
          : Number(shop.default_delivery_fee) || 0;
        const platformFee =
          await this.platformSettingsRepository.getPlatformFee();
        const totalPrice =
          Math.round((itemTotal + deliveryFee + platformFee) * 100) / 100;

        const delivery_address_snapshot: DeliveryAddressSnapshot = {
          hostel_block: deliveryAddress.hostel_block,
          building: deliveryAddress.building,
          room_number: deliveryAddress.room_number,
          notes: deliveryAddress.notes,
        };

        const display_id = await this.generateDisplayId(tx);

        let batchIdToLink: string | undefined = undefined;

        if (batch_id) {
          const lockedBatch = await tx.$queryRaw<BatchQueryRow[]>`
          SELECT id, status, cutoff_time FROM "Batch" 
          WHERE id = ${batch_id} AND shop_id = ${shop_id} FOR UPDATE
        `;
          if (!lockedBatch || lockedBatch.length === 0) {
            throw new ValidationError("The selected batch does not exist.");
          }
          if (lockedBatch[0].status !== "OPEN") {
            throw new ValidationError(
              `This batch is no longer accepting orders (Status: ${lockedBatch[0].status}).`
            );
          }
          const now = new Date();
          const cutoffTime = new Date(lockedBatch[0].cutoff_time);
          if (cutoffTime.getTime() <= now.getTime()) {
            throw new ValidationError(
              "The selected batch has already expired."
            );
          }
          batchIdToLink = lockedBatch[0].id;
          requested_delivery_time = cutoffTime;
        } else if (requested_delivery_time) {
          const batch = await this.findOrCreateBatchForRequestedTime(
            tx,
            shop_id,
            requested_delivery_time
          );
          if (batch) {
            batchIdToLink = batch.id;
            requested_delivery_time = new Date(batch.cutoff_time);
          }
        }

        const order = await tx.order.create({
          data: {
            display_id,
            user_id: user_id,
            shop_id: shop_id,
            ...(batchIdToLink ? { batch_id: batchIdToLink } : {}),
            item_total: itemTotal,
            delivery_fee: deliveryFee,
            platform_fee: platformFee,
            total_price: totalPrice,
            payment_method,
            payment_status:
              payment_method === "ONLINE" ? "COMPLETED" : "PENDING",
            pg_payment_id,
            upi_transaction_id,
            delivery_address_snapshot,
            requested_delivery_time,
            customer_notes,
            is_direct_delivery: is_direct_delivery ?? false,
            items: {
              create: cart.items.map((item) => {
                const prod = productDetailsMap.get(item.product_id);
                return {
                  product_id: item.product_id,
                  quantity: item.quantity,
                  price: prod ? prod.price : item.product.price,
                };
              }),
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

        return { order, shopOwnerId: shop.user?.id };
      }
    );

    if (shopOwnerId) {
      try {
        await this.notificationService.publishNotification(shopOwnerId, {
          title: "New Order Received",
          message: `You have received a new order with ID: ${order.display_id}`,
          action_url: getShopOrderUrl(order.id),
          type: "INFO",
        });
      } catch (error) {
        log.error({ err: error }, "Notification Error:");
      }
    }

    return order;
  }
}
