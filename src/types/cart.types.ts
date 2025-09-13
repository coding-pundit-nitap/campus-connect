import { Cart, CartItem, Category, Product } from "@prisma/client";

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
  items: (CartItem & {
    product: SerializedProduct & { shop?: { name: string; id: string } };
  })[];
};
export type SerializedCartItem = SerializedFullCart["items"][number];

export type FullCart = Cart & {
  items: (CartItem & {
    product: Product & {
      shop?: { name: string; id: string };
      category: Category;
    };
  })[];
};
