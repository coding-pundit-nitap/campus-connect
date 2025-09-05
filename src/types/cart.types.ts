import { Cart, CartItem } from "@prisma/client";

import { SerializedProduct } from "./product.types";

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  shop_name: string;
  product_id: string;
}

export interface ShopCart {
  id: string;
  totalPrice: number;
  totalItems: number;
  items: CartItemData[];
  shop_name: string;
}

export interface CartSummary {
  totalPrice: number;
  totalItems: number;
  shopCarts: ShopCart[];
}

export interface CartDrawerState {
  isLoading: boolean;
  error: boolean;
  isEmpty: boolean;
  summary: CartSummary | null;
}

export type SerializedFullCart = Cart & {
  items: (CartItem & { product: SerializedProduct })[];
};
export type FullCartItem = SerializedFullCart["items"][number];
