import {
  Category,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  Shop,
} from "@prisma/client";

import { SerializedProduct } from "./product.types";
export type OrderWithDetails = Order & {
  items: (OrderItem & {
    product: Product & { category?: Category | null } & {
      shop: {
        id: string;
        name: string;
        qr_image_key: string;
        upi_id: string;
      } | null;
    };
  })[];
  user: {
    name: string;
    id: string;
    email: string;
    phone: string | null;
  } | null;
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
  items: SerializedOrderItemWithProduct[];
  user: {
    name: string;
    phone: string;
  };
};
