import { Order, OrderItem, PaymentMethod, Product, Shop } from "@prisma/client";

import { SerializedProduct } from "./product.types";
export type OrderWithDetails = Order & {
  shop: Shop;
  items: (OrderItem & {
    product: Product;
  })[];
};

export type CreateOrderPayload = {
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  requested_delivery_time?: Date;
};

export type SerializedShop = Omit<Shop, "created_at" | "updated_at"> & {
  created_at: string;
  updated_at: string;
};

export type SerializedOrderItem = Omit<OrderItem, "quantity" | "price"> & {
  quantity: number;
  price: number;
};

export type SerializedOrder = Omit<
  Order,
  | "created_at"
  | "updated_at"
  | "total_price"
  | "requested_delivery_time"
  | "estimated_delivery_time"
  | "actual_delivery_time"
> & {
  created_at: string;
  updated_at: string;
  total_price: number;
  requested_delivery_time?: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
};

export type SerializedOrderItemWithProduct = SerializedOrderItem & {
  product: SerializedProduct;
};

export type SerializedOrderWithDetails = SerializedOrder & {
  shop: SerializedShop;
  items: SerializedOrderItemWithProduct[];
  user: {
    name: string;
  };
};
