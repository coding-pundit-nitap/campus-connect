import axiosInstance from "@/lib/axios";
import { Order } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

/**
 * Service class for seller-related API operations.
 *
 * Provides methods to interact with the seller API endpoints, including fetching
 * seller orders. Implements proper error handling and type safety for all
 * seller operations.
 *
 */
class SellerAPIService {
  /**
   * Fetches all orders for the authenticated seller.
   *
   * Retrieves a complete list of orders that belong to the currently
   * authenticated seller. This includes orders across all statuses
   * and provides comprehensive order information for seller management.
   *
   * @returns A promise that resolves to an array of seller orders
   *
   * @throws {Error} When API request fails, user is not authenticated as seller, or returns invalid data
   *
   */
  async fetchSellerOrders(): Promise<Order[]> {
    const url = `/seller/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch seller orders");
    }
    return response.data.data;
  }
}

const sellerAPIService = new SellerAPIService();

export default sellerAPIService;
