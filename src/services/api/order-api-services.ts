/**
 * Order API service module for the college connect application.
 *
 * This module provides HTTP client functionality for order operations including
 * fetching user orders and retrieving specific order details. It handles
 * API communication with proper error handling and type safety for order-related
 * operations in the e-commerce functionality.
 *
 */
import { Order } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.type";

/**
 * Service class for order-related API operations.
 *
 * Provides methods to interact with the order API endpoints, including fetching
 * user order history and retrieving specific order details. Implements proper error
 * handling and type safety for all order operations.
 *
 */
class OrderAPIService {
  /**
   * Fetches all orders for the current authenticated user.
   *
   * Retrieves the complete order history including order details, status,
   * and timestamps for the authenticated user. Used to display order history
   * and track order status across the application.
   *
   */
  async fetchUserOrders(): Promise<Order[]> {
    const url = `/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch orders");
    }
    return response.data.data;
  }

  /**
   * Fetches detailed information for a specific order by ID.
   *
   * Retrieves complete order information including items, pricing, status,
   * and shipping details for a specific order. Used for order detail views
   * and order tracking functionality.
   *
   */
  async fetchOrderById(order_id: string): Promise<Order> {
    const url = `/orders/${order_id}`;
    const response = await axiosInstance.get<ActionResponse<Order>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch order");
    }
    return response.data.data;
  }
}

/**
 * Singleton instance of the OrderAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all order-related API operations.
 *
 */
const orderAPIService = new OrderAPIService();

export default orderAPIService;
