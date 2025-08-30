import { Cart, CartItem, Product } from "@prisma/client";

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

export type FullCart = Cart & {
  items: (CartItem & {
    product: Pick<
      Product,
      "name" | "price" | "description" | "image_url" | "shop_id" | "discount"
    > & {
      shop: {
        name: string;
      };
    };
  })[];
};
