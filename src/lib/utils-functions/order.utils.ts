import { Order, OrderItem, Shop } from "@prisma/client";

import {
  OrderWithDetails,
  SerializedOrder,
  SerializedOrderItem,
  SerializedOrderWithDetails,
  SerializedShop,
} from "@/types";

import { serializeProduct } from "./product.utils";

export const transformDateToLocaleString = (date: Date): string => {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const serializeShop = (shop: Shop): SerializedShop => {
  return {
    ...shop,
    created_at: transformDateToLocaleString(shop.created_at),
    updated_at: transformDateToLocaleString(shop.updated_at),
  };
};

export const serializeOrderItem = (
  orderItem: OrderItem
): SerializedOrderItem => {
  return {
    ...orderItem,
    price: Number(orderItem.price),
    quantity: Number(orderItem.quantity),
  };
};

export const serializeOrder = (order: Order): SerializedOrder => {
  return {
    ...order,
    created_at: transformDateToLocaleString(order.created_at),
    updated_at: transformDateToLocaleString(order.updated_at),
    total_price: Number(order.total_price),
    requested_delivery_time: order.requested_delivery_time
      ? transformDateToLocaleString(order.requested_delivery_time)
      : undefined,
    estimated_delivery_time: order.estimated_delivery_time
      ? transformDateToLocaleString(order.estimated_delivery_time)
      : undefined,
    actual_delivery_time: order.actual_delivery_time
      ? transformDateToLocaleString(order.actual_delivery_time)
      : undefined,
  };
};

export const serializeOrderWithDetails = (
  order: OrderWithDetails
): SerializedOrderWithDetails => {
  return {
    ...serializeOrder(order),
    shop: {
      ...serializeShop(order.shop),
    },
    items: order.items.map((item) => ({
      ...serializeOrderItem(item),
      product: serializeProduct(item.product),
    })),
  };
};
