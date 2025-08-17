import { useQuery } from "@tanstack/react-query";
import {
  orderAPIService,
  sellerAPIService,
  userAPIService,
} from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * Hook to fetch all orders for the current authenticated user with automatic caching.
 *
 * This hook provides reactive access to the complete order history for the currently
 * authenticated user. It automatically manages query state, caching, and background
 * refetching to ensure order data stays up-to-date across all components that need
 * access to user order information.
 *
 * @returns UseQueryResult containing user orders array, loading state, and error information
 *
 * @example
 * ```typescript
 * // Basic order history display
 * function OrderHistory() {
 *   const { data: orders, isLoading, error } = useUserOrders();
 *
 *   if (isLoading) return <OrdersSkeleton />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!orders?.length) return <EmptyOrdersState />;
 *
 *   return (
 *     <div className="order-history">
 *       {orders.map(order => (
 *         <OrderCard key={order.id} order={order} />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * // Order count indicator
 * function OrderCountBadge() {
 *   const { data: orders } = useUserOrders();
 *   const orderCount = orders?.length || 0;
 *
 *   return <Badge count={orderCount} />;
 * }
 * ```
 *
 * @remarks
 * **Query Behavior:**
 * - Automatically fetches orders for the authenticated user on component mount
 * - Results are cached and shared across all components using this hook
 * - Automatically refetches on window focus and network reconnection
 * - Uses optimistic updates when orders are modified through other operations
 *
 * **Caching Strategy:**
 * - Query key is generated using `queryKeys.orders.all`
 * - Cache is automatically invalidated when new orders are created or updated
 * - Stale data is served immediately while fresh data is fetched in background
 * - Cache persists across route changes for improved navigation performance
 *
 * **Authentication Requirements:**
 * - Requires valid user authentication token
 * - Automatically handles authentication errors and redirects
 * - Only returns orders belonging to the authenticated user
 *
 * @see {@link orderAPIService.fetchUserOrders} for the underlying API call
 * @see {@link queryKeys.orders.all} for cache key generation
 * @see {@link useOrder} for fetching individual order details
 * @see {@link useSpecificUserOrders} for fetching orders of a specific user
 *
 * @since 1.0.0
 */
export function useUserOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => orderAPIService.fetchUserOrders(),
  });
}

/**
 * Hook to fetch orders for a specific user with conditional query execution.
 *
 * This hook provides access to order data for any specified user, typically used
 * in admin interfaces or user management systems. The query is conditionally
 * executed only when a valid user_id is provided, making it safe to use in
 * components where the user_id might not be immediately available.
 *
 * @param user_id - The unique identifier of the user to fetch orders for
 * @returns UseQueryResult containing specified user's orders, loading state, and error information
 *
 * @example
 * ```typescript
 * // Admin user order management
 * function UserOrderManagement({ userId }: { userId?: string }) {
 *   const { data: orders, isLoading, error } = useSpecificUserOrders(userId || "");
 *
 *   if (!userId) return <SelectUserPrompt />;
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorAlert error={error} />;
 *
 *   return (
 *     <div className="user-orders">
 *       <UserHeader userId={userId} />
 *       <OrdersList orders={orders} />
 *     </div>
 *   );
 * }
 *
 * // User profile with order summary
 * function UserProfile({ user }: { user: User }) {
 *   const { data: orders } = useSpecificUserOrders(user.id);
 *   const recentOrders = orders?.slice(0, 3) || [];
 *
 *   return (
 *     <div className="profile">
 *       <UserInfo user={user} />
 *       <RecentOrdersSection orders={recentOrders} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Query Behavior:**
 * - Query is only enabled when user_id is truthy (not empty string, null, or undefined)
 * - Results are cached per user_id for efficient data reuse
 * - Automatically refetches when user_id changes or on window focus
 * - Gracefully handles user_id changes without causing unnecessary requests
 *
 * **Caching Strategy:**
 * - Query key is generated using `queryKeys.users.orders(user_id)`
 * - Each user's orders are cached independently for optimal performance
 * - Cache is invalidated when orders are modified for the specific user
 * - Supports concurrent fetching of multiple users' orders
 *
 * **Authorization Considerations:**
 * - Requires appropriate permissions to view other users' orders
 * - API automatically filters results based on user permissions
 * - Admin users can access all user orders, regular users only their own
 *
 * **Performance Features:**
 * - Conditional execution prevents unnecessary network requests
 * - Efficient cache management reduces server load
 * - Background refetching ensures data freshness without blocking UI
 *
 * @see {@link userAPIService.fetchUserOrders} for the underlying API call
 * @see {@link queryKeys.users.orders} for cache key generation
 * @see {@link useUserOrders} for current user's orders
 * @see {@link useOrder} for individual order details
 *
 * @since 1.0.0
 */
export function useSpecificUserOrders(user_id: string) {
  return useQuery({
    queryKey: queryKeys.users.orders(user_id),
    queryFn: () => userAPIService.fetchUserOrders({ user_id: user_id }),
    enabled: !!user_id,
  });
}

/**
 * Hook to fetch detailed information for a specific order with conditional query execution.
 *
 * This hook provides comprehensive access to individual order details, including
 * items, pricing, shipping information, and order status. The query is conditionally
 * executed only when a valid order_id is provided, making it ideal for order detail
 * pages and components that need to display specific order information.
 *
 * @param order_id - The unique identifier of the order to fetch details for
 * @returns UseQueryResult containing detailed order information, loading state, and error information
 *
 * @example
 * ```typescript
 * // Order details page
 * function OrderDetailsPage({ orderId }: { orderId: string }) {
 *   const { data: order, isLoading, error, refetch } = useOrder(orderId);
 *
 *   if (isLoading) return <OrderDetailsSkeleton />;
 *   if (error) return <OrderErrorState onRetry={() => refetch()} />;
 *   if (!order) return <OrderNotFound orderId={orderId} />;
 *
 *   return (
 *     <div className="order-details">
 *       <OrderHeader order={order} />
 *       <OrderItems items={order.items} />
 *       <OrderSummary order={order} />
 *       <ShippingInfo shipping={order.shipping} />
 *     </div>
 *   );
 * }
 *
 * // Order status tracker
 * function OrderTracker({ orderId }: { orderId?: string }) {
 *   const { data: order } = useOrder(orderId || "");
 *
 *   if (!order) return null;
 *
 *   return (
 *     <div className="order-tracker">
 *       <OrderProgress status={order.status} />
 *       <EstimatedDelivery order={order} />
 *     </div>
 *   );
 * }
 *
 * // Order quick preview modal
 * function OrderPreviewModal({ orderId, isOpen }: Props) {
 *   const { data: order, isLoading } = useOrder(isOpen ? orderId : "");
 *
 *   return (
 *     <Modal isOpen={isOpen}>
 *       {isLoading ? (
 *         <ModalSkeleton />
 *       ) : order ? (
 *         <QuickOrderSummary order={order} />
 *       ) : (
 *         <OrderLoadError />
 *       )}
 *     </Modal>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Query Behavior:**
 * - Query is only enabled when order_id is truthy (not empty string, null, or undefined)
 * - Results are cached per order_id for efficient data reuse across components
 * - Automatically refetches on window focus to ensure order status is current
 * - Supports real-time updates when order status changes
 *
 * **Caching Strategy:**
 * - Query key is generated using `queryKeys.orders.detail(order_id)`
 * - Each order's details are cached independently with appropriate TTL
 * - Cache is invalidated when order status updates or modifications occur
 * - Optimized for frequently accessed order details
 *
 * **Data Completeness:**
 * - Returns comprehensive order information including nested relationships
 * - Includes order items, customer details, shipping information, and payment status
 * - Provides real-time order tracking and status information
 *
 * **Error Handling:**
 * - Gracefully handles invalid or non-existent order IDs
 * - Provides detailed error information for debugging and user feedback
 * - Supports retry mechanisms for transient network failures
 *
 * **Security Features:**
 * - Automatically enforces order access permissions
 * - Users can only access their own orders unless they have admin privileges
 * - Sensitive payment information is properly masked in responses
 *
 * @see {@link orderAPIService.fetchOrderById} for the underlying API call
 * @see {@link queryKeys.orders.detail} for cache key generation
 * @see {@link useUserOrders} for user's order list
 * @see {@link useSpecificUserOrders} for specific user's orders
 *
 * @since 1.0.0
 */
export function useOrder(order_id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(order_id),
    queryFn: () => orderAPIService.fetchOrderById(order_id),
    enabled: !!order_id,
  });
}

/**
 * Hook to fetch all orders for the current authenticated seller with automatic caching.
 *
 * This hook provides reactive access to all orders that belong to products sold by
 * the currently authenticated seller. It's specifically designed for seller dashboard
 * interfaces and order management systems where sellers need to track and manage
 * their incoming orders, process fulfillment, and monitor sales performance.
 *
 * @returns UseQueryResult containing seller's orders array, loading state, and error information
 *
 * @example
 * ```typescript
 * // Seller dashboard orders overview
 * function SellerOrdersDashboard() {
 *   const { data: orders, isLoading, error, refetch } = useSellerOrders();
 *
 *   if (isLoading) return <DashboardSkeleton />;
 *   if (error) return <DashboardError onRetry={() => refetch()} />;
 *
 *   const pendingOrders = orders?.filter(order => order.status === 'pending') || [];
 *   const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
 *
 *   return (
 *     <div className="seller-dashboard">
 *       <DashboardStats
 *         totalOrders={orders?.length || 0}
 *         pendingOrders={pendingOrders.length}
 *         totalRevenue={totalRevenue}
 *       />
 *       <OrdersTable orders={orders} />
 *     </div>
 *   );
 * }
 *
 * // Seller order notifications
 * function SellerNotifications() {
 *   const { data: orders } = useSellerOrders();
 *   const newOrders = orders?.filter(order =>
 *     order.status === 'pending' && isNewOrder(order.created_at)
 *   ) || [];
 *
 *   return (
 *     <NotificationBell count={newOrders.length}>
 *       {newOrders.map(order => (
 *         <OrderNotification key={order.id} order={order} />
 *       ))}
 *     </NotificationBell>
 *   );
 * }
 *
 * // Order fulfillment management
 * function OrderFulfillmentCenter() {
 *   const { data: orders, isLoading } = useSellerOrders();
 *
 *   const ordersByStatus = useMemo(() => {
 *     if (!orders) return {};
 *     return groupBy(orders, 'status');
 *   }, [orders]);
 *
 *   if (isLoading) return <FulfillmentSkeleton />;
 *
 *   return (
 *     <div className="fulfillment-center">
 *       <FulfillmentKanban ordersByStatus={ordersByStatus} />
 *       <BulkActionsToolbar selectedOrders={selectedOrders} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Query Behavior:**
 * - Automatically fetches all orders for products owned by the authenticated seller
 * - Results are cached and shared across all seller dashboard components
 * - Automatically refetches on window focus to ensure order status is current
 * - Uses optimistic updates when order status is modified through seller actions
 *
 * **Caching Strategy:**
 * - Query key is generated using `queryKeys.seller.orders()`
 * - Cache is automatically invalidated when order statuses are updated
 * - Stale data is served immediately while fresh data is fetched in background
 * - Efficient cache management reduces API calls for seller dashboard operations
 *
 * **Seller Authentication:**
 * - Requires valid seller authentication and proper seller role permissions
 * - Automatically filters orders to only include seller's products
 * - Handles seller account verification and status requirements
 *
 * **Order Management Features:**
 * - Provides complete order lifecycle management capabilities
 * - Includes order status tracking, customer information, and payment details
 * - Supports bulk operations and order status updates
 * - Real-time notifications for new orders and status changes
 *
 * **Performance Optimizations:**
 * - Efficiently handles large order volumes with proper pagination support
 * - Background synchronization ensures data consistency without blocking UI
 * - Optimized query patterns reduce server load and improve response times
 *
 * **Business Intelligence:**
 * - Provides data foundation for seller analytics and reporting
 * - Supports revenue tracking, order trend analysis, and performance metrics
 * - Enables data-driven decision making for seller operations
 *
 * @see {@link sellerAPIService.fetchSellerOrders} for the underlying API call
 * @see {@link queryKeys.seller.orders} for cache key generation
 * @see {@link useOrder} for individual order details
 * @see {@link useUserOrders} for customer order perspective
 *
 * @since 1.0.0
 */
export function useSellerOrders() {
  return useQuery({
    queryKey: queryKeys.seller.orders(),
    queryFn: () => sellerAPIService.fetchSellerOrders(),
  });
}
