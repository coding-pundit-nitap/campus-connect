import {
  BatchSlot,
  Cart,
  CartItem,
  Category,
  Prisma,
  Product,
} from "@/generated/client";

import { SerializedProduct } from "./product.types";

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  image_url: string;
  shop_name: string;
  product_id: string;
  shop_id: string;
}

export interface ShopCart {
  id: string;
  totalPrice: number;
  totalItems: number;
  items: CartItemData[];
  shop_name: string;
  qr_image_key: string;
  upi_id: string;
  min_order_value: string;
}

export interface CartSummary {
  totalPrice: number;
  totalItems: number;
  shopCarts: ShopCart[];
  shop_id: string;
}

export interface CartDrawerState {
  isLoading: boolean;
  error: boolean;
  isEmpty: boolean;
  summary: CartSummary | null;
}

export type SerializedFullCart = Cart & {
  items: (CartItem & {
    product: SerializedProduct & {
      shop?: {
        name: string;
        id: string;
        qr_image_key: string;
        upi_id: string;
        opening: string;
        closing: string;
        default_delivery_fee: string;
        direct_delivery_fee: string;
        min_order_value: string;
        batch_slots?: Pick<
          BatchSlot,
          "id" | "cutoff_time_minutes" | "label" | "sort_order" | "is_active"
        >[];
      };
      category: Category | null;
    };
  })[];
};
export type SerializedCartItem = SerializedFullCart["items"][number];

export type FullCart = Cart & {
  items: (CartItem & {
    product: Product & {
      shop: {
        name: string;
        id: string;
        qr_image_key: string;
        upi_id: string;
        opening: string;
        closing: string;
        default_delivery_fee: Prisma.Decimal;
        direct_delivery_fee: Prisma.Decimal;
        min_order_value: Prisma.Decimal;
        batch_slots: Pick<
          BatchSlot,
          "id" | "cutoff_time_minutes" | "label" | "sort_order" | "is_active"
        >[];
      };
      category: Category | null;
    };
  })[];
};
