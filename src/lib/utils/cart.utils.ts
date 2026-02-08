import {
  CartItemData,
  CartSummary,
  SerializedCartItem,
  SerializedFullCart,
  ShopCart,
} from "@/types";

import { ImageUtils } from "./image.utils";

class CartDrawerServices {
  calculateCartItemsPrice = (items: CartItemData[]): number => {
    return items.reduce(
      (total, item) =>
        total + ((item.price * (100 - item.discount)) / 100) * item.quantity,
      0
    );
  };

  calculateCartItemsCount = (items: CartItemData[]): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  transformCartItem = (item: SerializedCartItem): CartItemData => {
    return {
      id: item.id,
      image_url:
        ImageUtils.getImageUrl(item.product.image_key) ||
        "/placeholders/placeholder.png",
      price: Number(Number(item.product.price).toFixed(2)),
      quantity: item.quantity,
      name: item.product.name,
      shop_name: item.product.shop?.name ?? "Unknown Shop",
      product_id: item.product_id,
      shop_id: item.product.shop?.id || "unknown",
      discount: Number(item.product.discount) || 0,
    };
  };

  transformToShopCart = (cart: SerializedFullCart): ShopCart => {
    const items = cart.items.map(this.transformCartItem);
    const totalPrice = this.calculateCartItemsPrice(items);
    const totalItems = this.calculateCartItemsCount(items);
    const shop_name = items.length > 0 ? items[0].shop_name : "Empty Cart";

    return {
      id: cart.id,
      items,
      totalPrice,
      totalItems,
      shop_name,
      qr_image_key: cart.items[0].product.shop.qr_image_key,
      upi_id: cart.items[0].product.shop.upi_id,
      min_order_value: cart.items[0].product.shop.min_order_value,
    };
  };

  createCartSummary = (shopCarts: ShopCart[]): CartSummary => {
    const totalPrice = shopCarts.reduce(
      (total, cart) => total + cart.totalPrice,
      0
    );
    const totalItems = shopCarts.reduce(
      (total, cart) => total + cart.totalItems,
      0
    );

    const shop_id =
      shopCarts.length > 0 ? shopCarts[0].items[0].shop_id : "unknown";

    return {
      totalPrice,
      totalItems,
      shopCarts,
      shop_id,
    };
  };

  transformFullCartsToShopCarts = (
    fullCarts: SerializedFullCart[]
  ): ShopCart[] => {
    return fullCarts
      .filter((cart) => cart.items.length > 0)
      .map(this.transformToShopCart.bind(this));
  };

  updateItemQuantity = (
    product_id: string,
    newQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    mutationFn({ product_id, quantity: newQuantity });
  };

  increaseItemQuantity = (
    product_id: string,
    currentQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    this.updateItemQuantity(product_id, currentQuantity + 1, mutationFn);
  };

  decreaseItemQuantity = (
    product_id: string,
    currentQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    this.updateItemQuantity(product_id, currentQuantity - 1, mutationFn);
  };
}

export const cartUIService = new CartDrawerServices();

export default cartUIService;
