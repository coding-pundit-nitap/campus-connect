import {
  CartItemData,
  CartSummary,
  FullCart,
  FullCartItem,
  ShopCart,
} from "@/types";

/**
 * Service class that provides utility methods for cart operations and transformations.
 * Handles cart calculations, data transformations, and cart management operations.
 */
class CartDrawerServices {
  /**
   * Calculates the total price of all items in a cart
   * @param items - Array of cart items to calculate total price for
   * @returns The total price (price × quantity) for all items
   */
  calculateCartItemsPrice = (items: CartItemData[]): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  /**
   * Calculates the total quantity of all items in a cart
   * @param items - Array of cart items to count
   * @returns The total quantity of all items combined
   */
  calculateCartItemsCount = (items: CartItemData[]): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * Transforms a full cart item from the API response to the UI-friendly CartItemData format
   * @param item - The full cart item from the API response
   * @returns Transformed cart item data suitable for UI display
   */
  transformCartItem = (item: FullCartItem): CartItemData => {
    return {
      id: item.id,
      image_url: item.product.image_url,
      price: Number(item.product.price),
      quantity: item.quantity,
      name: item.product.name,
      shop_name: item.product.shop?.name ?? "Unknown Shop",
      product_id: item.product_id,
    };
  };

  /**
   * Transforms a full cart from the API response to a shop-specific cart structure
   * @param cart - The full cart data from the API
   * @returns A shop cart with calculated totals and transformed items
   */
  transformToShopCart = (cart: FullCart): ShopCart => {
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

  /**
   * Creates a comprehensive cart summary from multiple shop carts
   * @param shopCarts - Array of shop-specific carts
   * @returns A summary containing total price, total items, and all shop carts
   */
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

  /**
   * Transforms multiple full carts to shop carts, filtering out empty carts
   * @param fullCarts - Array of full cart data from the API
   * @returns Array of shop carts with items, excluding empty carts
   */
  transformFullCartsToShopCarts = (fullCarts: FullCart[]): ShopCart[] => {
    return fullCarts
      .filter((cart) => cart.items.length > 0)
      .map(this.transformToShopCart.bind(this));
  };

  /**
   * Handles the checkout process initiation
   * Currently logs to console, can be extended to redirect to checkout page
   */
  handleProceedToCheckout = (): void => {
    console.log("Proceeding to checkout...");
    // Example: window.location.href = '/checkout';
  };

  /**
   * Updates the quantity of a specific cart item
   * @param productId - The ID of the product to update
   * @param newQuantity - The new quantity to set
   * @param mutationFn - The mutation function to execute the update
   */
  updateItemQuantity = (
    productId: string,
    newQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    mutationFn({ product_id: productId, quantity: newQuantity });
  };

  /**
   * Increases the quantity of a cart item by 1
   * @param productId - The ID of the product to increase quantity for
   * @param currentQuantity - The current quantity of the item
   * @param mutationFn - The mutation function to execute the update
   */
  increaseItemQuantity = (
    productId: string,
    currentQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    this.updateItemQuantity(productId, currentQuantity + 1, mutationFn);
  };

  /**
   * Decreases the quantity of a cart item by 1
   * @param productId - The ID of the product to decrease quantity for
   * @param currentQuantity - The current quantity of the item
   * @param mutationFn - The mutation function to execute the update
   */
  decreaseItemQuantity = (
    productId: string,
    currentQuantity: number,
    mutationFn: (data: { product_id: string; quantity: number }) => void
  ): void => {
    this.updateItemQuantity(productId, currentQuantity - 1, mutationFn);
  };
}

/**
 * Singleton instance of CartDrawerServices for cart operations
 */
export const cartUIService = new CartDrawerServices();

export default cartUIService;
