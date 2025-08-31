import { Shop } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.types";

/**
 * Service class for shop-related API operations.
 *
 * Provides methods to interact with the shop API endpoints, including fetching
 * individual shop details. Implements proper error handling and type safety for all
 * shop operations.
 *
 */
class ShopAPIService {
  /**
   * Fetches detailed information for a specific shop.
   *
   * Retrieves comprehensive shop details including shop metadata,
   * seller information, and shop configuration. Used for displaying
   * shop profiles and managing shop-specific operations.
   *
   * @param params - The parameters for fetching shop details
   * @param params.shop_id - The unique identifier of the shop to fetch
   * @returns A promise that resolves to the complete shop data
   *
   * @throws {Error} When API request fails, shop is not found, or returns invalid data
   *
   */
  async fetchShop({ shop_id }: { shop_id: string }): Promise<Shop> {
    const url = `/shops/${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<Shop>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch shop");
    }
    return response.data.data;
  }

  async fetchShopsByUser(): Promise<Shop> {
    const url = `/shops`;
    const response = await axiosInstance.get<ActionResponse<Shop>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch shops");
    }
    return response.data.data;
  }
}

/**
 * Singleton instance of the ShopAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all shop-related API operations.
 *
 */
export const shopAPIService = new ShopAPIService();

export default shopAPIService;
