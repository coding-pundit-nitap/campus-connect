/**
 * Order API service module for the college connect application.
 *
 * This module provides HTTP client functionality for order operations including
 * fetching user orders and retrieving specific order details. It handles
 * API communication with proper error handling and type safety for order-related
 * operations in the e-commerce functionality.
 *
 * @example
 * ```typescript
 * // Fetch all orders for current user
 * const orders = await orderAPIService.fetchUserOrders();
 *
 * // Get specific order details
 * const order = await orderAPIService.fetchOrderById('order123');
 * ```
 *
 * @remarks
 * **Features:**
 * - User order history fetching
 * - Individual order detail retrieval
 * - Comprehensive error handling
 * - Type-safe API responses
 * - Axios-based HTTP client integration
 *
 * @see {@link Order} for order data structure
 * @see {@link ActionResponse} for API response format
 *
 * @since 1.0.0
 */
import axiosInstance from "@/lib/axios";
import { Order } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

/**
 * Service class for order-related API operations.
 *
 * Provides methods to interact with the order API endpoints, including fetching
 * user order history and retrieving specific order details. Implements proper error
 * handling and type safety for all order operations.
 *
 * @example
 * ```typescript
 * // Usage in a React component
 * const OrderHistory = () => {
 *   const [orders, setOrders] = useState<Order[]>([]);
 *   const [loading, setLoading] = useState(true);
 *
 *   useEffect(() => {
 *     orderAPIService.fetchUserOrders()
 *       .then(setOrders)
 *       .catch(console.error)
 *       .finally(() => setLoading(false));
 *   }, []);
 *
 *   return <OrderList orders={orders} loading={loading} />;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in server actions
 * export async function getOrderDetails(orderId: string) {
 *   try {
 *     const order = await orderAPIService.fetchOrderById(orderId);
 *     return { success: true, order };
 *   } catch (error) {
 *     return { success: false, error: error.message };
 *   }
 * }
 * ```
 *
 * @remarks
 * **API Integration:**
 * - Uses configured axios instance for HTTP requests
 * - Handles ActionResponse wrapper format
 * - Provides consistent error handling across methods
 * - Returns strongly typed order data
 *
 * **Error Handling:**
 * - Throws descriptive errors for failed requests
 * - Extracts error details from API responses
 * - Provides fallback error messages
 *
 * @see {@link fetchUserOrders} for retrieving order history
 * @see {@link fetchOrderById} for specific order details
 *
 * @since 1.0.0
 */
class OrderAPIService {
  /**
   * Fetches all orders for the current authenticated user.
   *
   * Retrieves the complete order history including order details, status,
   * and timestamps for the authenticated user. Used to display order history
   * and track order status across the application.
   *
   * @example
   * ```typescript
   * // Fetch orders in order history page
   * const OrderHistoryPage = () => {
   *   const [orders, setOrders] = useState<Order[]>([]);
   *   const [error, setError] = useState<string | null>(null);
   *
   *   useEffect(() => {
   *     orderAPIService.fetchUserOrders()
   *       .then(orders => {
   *         setOrders(orders);
   *         setError(null);
   *       })
   *       .catch(error => {
   *         console.error('Failed to load orders:', error);
   *         setError('Failed to load order history');
   *       });
   *   }, []);
   *
   *   if (error) return <ErrorMessage message={error} />;
   *   return <OrderHistoryList orders={orders} />;
   * };
   * ```
   *
   * @returns A promise that resolves to an array of user orders
   *
   * @remarks
   * **API Endpoint:** `GET /orders`
   *
   * **Response Handling:**
   * - Validates response success status
   * - Extracts order array from ActionResponse wrapper
   * - Throws error if request fails or data is missing
   *
   * **Use Cases:**
   * - Displaying order history in user dashboard
   * - Tracking order status and progress
   * - Order management and customer support
   * - Analytics and reporting features
   *
   * **Authentication:**
   * - Requires valid user authentication
   * - Returns only orders belonging to authenticated user
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   * @see {@link Order} for returned data structure
   * @see {@link fetchOrderById} for getting specific order details
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Fetch order details in order detail page
   * const OrderDetailPage = ({ orderId }: { orderId: string }) => {
   *   const [order, setOrder] = useState<Order | null>(null);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     orderAPIService.fetchOrderById(orderId)
   *       .then(order => {
   *         setOrder(order);
   *         setLoading(false);
   *       })
   *       .catch(error => {
   *         console.error('Failed to load order:', error);
   *         setLoading(false);
   *       });
   *   }, [orderId]);
   *
   *   if (loading) return <OrderDetailSkeleton />;
   *   return <OrderDetailView order={order} />;
   * };
   * ```
   *
   * @param order_id - The unique identifier of the order to fetch
   * @returns A promise that resolves to the complete order data
   *
   * @remarks
   * **API Endpoint:** `GET /orders/{order_id}`
   *
   * **Response Handling:**
   * - Validates response success status
   * - Extracts order data from ActionResponse wrapper
   * - Throws error if request fails or data is missing
   *
   * **Use Cases:**
   * - Displaying detailed order information
   * - Order tracking and status updates
   * - Customer support and order management
   * - Receipt and invoice generation
   *
   * **Security:**
   * - Validates user access to requested order
   * - Returns 404 for non-existent or unauthorized orders
   *
   * @throws {Error} When API request fails, order not found, or access denied
   *
   * @see {@link Order} for returned data structure
   * @see {@link fetchUserOrders} for getting all user orders
   *
   * @since 1.0.0
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
 * @example
 * ```typescript
 * // Import and use directly
 * import orderAPIService from '@/services/api/order-api-services';
 *
 * const orders = await orderAPIService.fetchUserOrders();
 * const order = await orderAPIService.fetchOrderById('order123');
 * ```
 *
 * @see {@link OrderAPIService} for available methods
 *
 * @since 1.0.0
 */
const orderAPIService = new OrderAPIService();

export default orderAPIService;
