import {
  BatchMilestone,
  BatchStatus,
  Category,
  Order,
  OrderItem,
  Product,
  Shop,
  UserAddress,
} from "@/generated/client";

import { PaymentMethod } from "./prisma.types";
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
  batch: {
    id: string;
    cutoff_time: Date;
    status: BatchStatus;
    delivery_status: {
      id: string;
      batch_id: string;
      current_milestone: BatchMilestone;
      estimated_arrival: Date | null;
      rider_name: string | null;
      rider_phone: string | null;
      created_at: Date;
      updated_at: Date;
    } | null;
  } | null;
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
  | "item_total"
  | "delivery_fee"
  | "platform_fee"
  | "total_price"
  | "requested_delivery_time"
  | "estimated_delivery_time"
  | "actual_delivery_time"
  | "delivery_address_snapshot"
> & {
  created_at: string;
  updated_at: string;
  item_total: number;
  delivery_fee: number;
  platform_fee: number;
  total_price: number;
  requested_delivery_time?: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  delivery_address_snapshot: DeliveryAddressSnapshot;
};
export type DeliveryAddressSnapshot = {
  hostel_block: string | null;
  building: string | null;
  room_number: string | null;
  notes: string | null;
};
export type SerializedOrderItemWithProduct = SerializedOrderItem & {
  product: SerializedProduct;
};

export type SerializedDeliveryAddress = Omit<
  UserAddress,
  "created_at" | "updated_at"
> & {
  created_at?: string;
  updated_at?: string;
};

export type SerializedOrderWithDetails = SerializedOrder & {
  items: SerializedOrderItemWithProduct[];
  batch: {
    id: string;
    cutoff_time: string;
    status: BatchStatus;
    delivery_status: {
      id: string;
      batch_id: string;
      current_milestone: BatchMilestone;
      estimated_arrival: string | null;
      rider_name: string | null;
      rider_phone: string | null;
      created_at: string;
      updated_at: string;
    } | null;
  } | null;
  user: {
    name: string;
    phone: string;
  };
};
