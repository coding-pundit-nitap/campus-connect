import { QueryClient, useQueryClient } from "@tanstack/react-query";

import { FullCart } from "@/services/cart.services";

import { queryKeys } from "./query-keys";

/**
 * Utility class for centralized React Query cache management operations.
 *
 * Provides a comprehensive set of methods for managing query cache state including
 * invalidation, prefetching, and direct cache manipulation. This class wraps the
 * QueryClient with domain-specific methods that align with the application's data structure.
 *
 */
export class QueryUtils {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidates all cart-related queries across the application.
   *
   * Triggers refetch for all cached cart data, ensuring fresh cart state
   * across all shops and user sessions. Use this when cart state may have
   * changed globally or when synchronization is required.
   *
   */
  invalidateAllCarts() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.cart.all,
    });
  }

  /**
   * Invalidates cart queries for a specific shop.
   *
   * Triggers refetch for cart data associated with the specified shop only.
   * This is more efficient than invalidating all carts when changes are
   * isolated to a single shop's cart.
   *
   * @param shop_id - The unique identifier of the shop whose cart should be invalidated
   * @returns Promise that resolves when invalidation is complete
   *
   */
  invalidateShopCart(shop_id: string) {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.cart.byShop(shop_id),
    });
  }

  /**
   * Invalidates all order-related queries across the application.
   *
   * Triggers refetch for all cached order data including user orders,
   * shop orders, and seller dashboard orders. Use when order state
   * changes may affect multiple domains.
   *
   * @returns Promise that resolves when invalidation is complete
   *
   */
  invalidateAllOrders() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.orders.all,
    });
  }

  /**
   * Invalidates order queries for a specific user.
   *
   * Triggers refetch for all orders associated with the specified user.
   * This includes order history, current orders, and order tracking data
   * specific to the user.
   *
   * @param user_id - The unique identifier of the user whose orders should be invalidated
   * @returns Promise that resolves when invalidation is complete
   *
   */
  invalidateUserOrders(user_id: string) {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.users.orders(user_id),
    });
  }

  /**
   * Invalidates seller-specific order queries.
   *
   * Triggers refetch for order data in the seller dashboard and management
   * interface. Use when order status changes affect seller views or when
   * seller order analytics need updating.
   *
   * @returns Promise that resolves when invalidation is complete
   *
   */
  invalidateSellerOrders() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.seller.orders(),
    });
  }

  /**
   * Invalidates product queries for a specific shop.
   *
   * Triggers refetch for all products associated with the specified shop.
   * This includes product listings, pagination data, and shop catalog
   * information. Use when shop products are added, updated, or removed.
   *
   * @param shop_id - The unique identifier of the shop whose products should be invalidated
   * @returns Promise that resolves when invalidation is complete
   *
   */
  invalidateShopProducts(shop_id: string) {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.shops.products(shop_id),
    });
  }

  /**
   * Clears all cached data from the React Query cache.
   *
   * Removes all cached queries and their data from memory. This is a
   * destructive operation that should be used sparingly, typically only
   * during user logout or critical error recovery scenarios.
   *
   */
  clearAllCache() {
    return this.queryClient.clear();
  }

  /**
   * Prefetches shop data for improved user experience.
   *
   * Loads shop details into the cache before they are needed, reducing
   * perceived loading time when users navigate to shop pages. The data
   * is cached with a 5-minute stale time for optimal performance.
   *
   * @param shop_id - The unique identifier of the shop to prefetch
   * @returns Promise that resolves when prefetching is complete
   *
   */
  async prefetchShop(shop_id: string) {
    const { shopAPIService } = await import("@/services/api");

    return this.queryClient.prefetchQuery({
      queryKey: queryKeys.shops.detail(shop_id),
      queryFn: () => shopAPIService.fetchShop({ shop_id: shop_id }),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }

  /**
   * Prefetches paginated shop products for improved browsing experience.
   *
   * Loads the first page of shop products into the cache using infinite query
   * pagination. This enables instant display of products when users visit
   * shop pages and sets up efficient pagination for subsequent pages.
   *
   * @param shop_id - The unique identifier of the shop whose products should be prefetched
   * @returns Promise that resolves when prefetching is complete
   *
   */
  async prefetchShopProducts(shop_id: string) {
    const { productAPIService } = await import("@/services/api");

    return this.queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.shops.products(shop_id),
      queryFn: ({ pageParam }) =>
        productAPIService.fetchShopProducts({
          shop_id: shop_id,
          cursor: pageParam as string | null,
        }),
      initialPageParam: null,
      staleTime: 1000 * 60 * 5,
    });
  }

  /**
   * Retrieves cached shop data without triggering a network request.
   *
   * Returns shop data from the cache if available, or undefined if not cached
   * or expired. Useful for optimistic UI updates and conditional rendering
   * based on available data.
   *
   * @param shop_id - The unique identifier of the shop to retrieve from cache
   * @returns The cached shop data or undefined if not available
   *
   */
  getCachedShop(shop_id: string) {
    return this.queryClient.getQueryData(queryKeys.shops.detail(shop_id));
  }

  /**
   * Retrieves cached cart data for a specific shop without triggering a network request.
   *
   * Returns cart data from the cache if available, or undefined if not cached
   * or expired. Useful for cart state management and optimistic updates
   * during cart operations.
   *
   * @param shop_id - The unique identifier of the shop whose cart should be retrieved
   * @returns The cached cart data or undefined if not available
   *
   */
  getCachedCart(shop_id: string) {
    return this.queryClient.getQueryData(queryKeys.cart.byShop(shop_id));
  }

  /**
   * Updates cached cart data for a specific shop without triggering a network request.
   *
   * Directly modifies cart data in the cache, enabling optimistic updates
   * and immediate UI responses. Use with caution and ensure data consistency
   * with server state through proper invalidation strategies.
   *
   * @param shop_id - The unique identifier of the shop whose cart should be updated
   * @param data - The new cart data to store in cache
   * @returns The updated cache data
   *
   * @warning Direct cache manipulation can lead to inconsistencies if not properly managed
   *
   */
  setCachedCart(shop_id: string, data: FullCart) {
    return this.queryClient.setQueryData(queryKeys.cart.byShop(shop_id), data);
  }
}

/**
 * React hook for accessing query utility functions.
 *
 * Returns a QueryUtils instance configured with the current React Query client.
 * This is the preferred method for accessing query utilities in React components
 * and provides full access to cache management operations.
 *
 * @returns A QueryUtils instance for the current React Query client
 *
 */
export function useQueryUtils() {
  const queryClient = useQueryClient();
  return new QueryUtils(queryClient);
}
