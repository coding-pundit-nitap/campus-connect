import {
  CartItemData,
  CartSummary,
  SerializedCartItem,
  SerializedFullCart,
  ShopCart,
} from "@/types";

class CartDrawerServices {
  calculateCartItemsPrice = (items: CartItemData[]): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  calculateCartItemsCount = (items: CartItemData[]): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  transformCartItem = (item: SerializedCartItem): CartItemData => {
    return {
      id: item.id,
      image_url: item.product.image_url,
      price: Number(item.product.price),
      quantity: item.quantity,
      name: item.product.name,
      shop_name: item.product.shop?.name ?? "Unknown Shop",
      product_id: item.product_id,
      shop_id: item.product.shop?.id || "unknown",
      discount: item.product.discount || 0,
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

    return {
      totalPrice,
      totalItems,
      shopCarts,
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
    productId: string,
    newQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    mutationFn({ product_id: productId, quantity: newQuantity });
  };

  increaseItemQuantity = (
    productId: string,
    currentQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    this.updateItemQuantity(productId, currentQuantity + 1, mutationFn);
  };

  decreaseItemQuantity = (
    productId: string,
    currentQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    this.updateItemQuantity(productId, currentQuantity - 1, mutationFn);
  };
}

export const cartUIService = new CartDrawerServices();

export default cartUIService;
