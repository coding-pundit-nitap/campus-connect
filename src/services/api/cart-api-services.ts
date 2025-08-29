import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.type";

import { FullCart } from "../cart.services";

class CartAPIService {
  /**
   * Fetches the cart data for a specific shop.
   *
   * Retrieves the complete cart information including all items, quantities,
   * and pricing details for a given shop. Used to display current cart state
   * and calculate totals for checkout processes.
   *
   * @param shop_id - The unique identifier of the shop to fetch cart for
   * @returns A promise that resolves to the complete cart data
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   */
  async fetchCartForShop(shop_id: string): Promise<FullCart> {
    const url = `/cart?shop_id=${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<FullCart>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch cart");
    }
    return response.data.data;
  }

  /**
   * Adds a new item to the cart or updates the quantity of an existing item.
   *
   * Performs an upsert operation on cart items - if the product already exists
   * in the cart, updates its quantity; otherwise, adds it as a new item.
   * Returns the updated cart state after the operation.
   *
   * @param product_id - The unique identifier of the product to add/update
   * @param quantity - The quantity to set (0 to remove item)
   * @returns A promise that resolves to the updated cart data
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   */
  async upsertCartItem(
    product_id: string,
    quantity: number
  ): Promise<FullCart> {
    const url = `/cart`;
    const response = await axiosInstance.post<ActionResponse<FullCart>>(url, {
      product_id,
      quantity,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to update cart");
    }
    return response.data.data;
  }

  /**
   * Fetches all carts for the authenticated user across all shops.
   *
   * Retrieves complete cart information for all shops where the user has items,
   * including all cart items, quantities, and product details. Used for displaying
   * comprehensive cart state and managing cross-shop cart operations.
   *
   * @returns A promise that resolves to an array of complete cart data
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   */
  async fetchAllUserCarts(): Promise<FullCart[]> {
    const url = `/cart/all`;
    const response = await axiosInstance.get<ActionResponse<FullCart[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch carts");
    }
    return response.data.data;
  }
}

const cartAPIService = new CartAPIService();

export default cartAPIService;
