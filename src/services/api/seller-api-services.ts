/**
 * Seller API service module for the college connect application.
 *
 * This module provides HTTP client functionality for seller operations including
 * fetching seller orders. It handles API communication with proper error handling
 * and type safety for seller-related operations in the e-commerce functionality.
 *
 * @example
 * ```typescript
 * // Fetch all orders for the current seller
 * const orders = await sellerAPIService.fetchSellerOrders();
 * console.log(`Found ${orders.length} orders`);
 * ```
 *
 * @remarks
 * **Features:**
 * - Order fetching for authenticated sellers
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
 * Service class for seller-related API operations.
 *
 * Provides methods to interact with the seller API endpoints, including fetching
 * seller orders. Implements proper error handling and type safety for all
 * seller operations.
 *
 * @example
 * ```typescript
 * // Usage in a React component for seller dashboard
 * const SellerDashboard = () => {
 *   const [orders, setOrders] = useState<Order[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const loadOrders = async () => {
 *     try {
 *       setLoading(true);
 *       const fetchedOrders = await sellerAPIService.fetchSellerOrders();
 *       setOrders(fetchedOrders);
 *       setError(null);
 *     } catch (err) {
 *       setError(err instanceof Error ? err.message : 'Failed to load orders');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   useEffect(() => {
 *     loadOrders();
 *   }, []);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return (
 *     <OrdersList
 *       orders={orders}
 *       onRefresh={loadOrders}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in server actions
 * export async function getSellerOrders() {
 *   try {
 *     const orders = await sellerAPIService.fetchSellerOrders();
 *     return { success: true, data: orders };
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
 * **Authentication:**
 * - Requires authenticated seller session
 * - Uses session-based authentication via axios instance
 * - Returns orders specific to the authenticated seller
 *
 * @see {@link fetchSellerOrders} for retrieving seller orders
 *
 * @since 1.0.0
 */
class SellerAPIService {
  /**
   * Fetches all orders for the authenticated seller.
   *
   * Retrieves a complete list of orders that belong to the currently
   * authenticated seller. This includes orders across all statuses
   * and provides comprehensive order information for seller management.
   *
   * @example
   * ```typescript
   * // Basic usage
   * const orders = await sellerAPIService.fetchSellerOrders();
   * console.log(`Seller has ${orders.length} orders`);
   *
   * // Process orders by status
   * const pendingOrders = orders.filter(order => order.status === 'PENDING');
   * const completedOrders = orders.filter(order => order.status === 'COMPLETED');
   * ```
   *
   * @example
   * ```typescript
   * // Usage in seller analytics
   * const SellerAnalytics = () => {
   *   const [orderStats, setOrderStats] = useState({
   *     total: 0,
   *     pending: 0,
   *     completed: 0,
   *     revenue: 0
   *   });
   *
   *   useEffect(() => {
   *     const loadStats = async () => {
   *       try {
   *         const orders = await sellerAPIService.fetchSellerOrders();
   *         const stats = {
   *           total: orders.length,
   *           pending: orders.filter(o => o.status === 'PENDING').length,
   *           completed: orders.filter(o => o.status === 'COMPLETED').length,
   *           revenue: orders
   *             .filter(o => o.status === 'COMPLETED')
   *             .reduce((sum, o) => sum + o.total, 0)
   *         };
   *         setOrderStats(stats);
   *       } catch (error) {
   *         console.error('Failed to load order statistics:', error);
   *       }
   *     };
   *
   *     loadStats();
   *   }, []);
   *
   *   return <StatsDisplay stats={orderStats} />;
   * };
   * ```
   *
   * @returns A promise that resolves to an array of seller orders
   *
   * @remarks
   * **API Endpoint:** `GET /seller/orders`
   *
   * **Authentication Required:** Yes - seller session
   *
   * **Response Data:**
   * - Returns all orders associated with the authenticated seller
   * - Includes complete order information (items, customer, status, etc.)
   * - Orders are returned in descending order by creation date
   *
   * **Use Cases:**
   * - Seller dashboard order management
   * - Order analytics and reporting
   * - Inventory tracking and fulfillment
   * - Revenue calculation and financial reporting
   *
   * **Order Information Included:**
   * - Order details (ID, total, status, dates)
   * - Customer information
   * - Ordered items and quantities
   * - Payment and shipping information
   * - Order history and status changes
   *
   * @throws {Error} When API request fails, user is not authenticated as seller, or returns invalid data
   *
   * @see {@link Order} for order data structure
   * @see {@link ActionResponse} for API response format
   *
   * @since 1.0.0
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

/**
 * Singleton instance of the SellerAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all seller-related API operations.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import sellerAPIService from '@/services/api/seller-api-services';
 *
 * const orders = await sellerAPIService.fetchSellerOrders();
 * ```
 *
 * @see {@link SellerAPIService} for available methods
 *
 * @since 1.0.0
 */
const sellerAPIService = new SellerAPIService();

export default sellerAPIService;
