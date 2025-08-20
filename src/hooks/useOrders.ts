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
