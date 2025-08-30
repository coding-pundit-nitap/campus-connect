import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { orderAPIService, sellerAPIService } from "@/services";

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
 */
export function useUserOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => orderAPIService.fetchUserOrders(),
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
 */
export function useSellerOrders() {
  return useQuery({
    queryKey: queryKeys.seller.orders(),
    queryFn: sellerAPIService.fetchSellerOrders,
  });
}
