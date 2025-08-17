/**
 * Query utilities module for centralized React Query cache management operations.
 *
 * This module provides a comprehensive utility class for managing React Query cache operations
 * in the college connect application. It offers a convenient wrapper around the QueryClient
 * with domain-specific methods for cache invalidation, prefetching, and data manipulation.
 *
 * @example
 * ```typescript
 * // Basic usage in a component
 * function ProductPage({ shopId }: { shopId: string }) {
 *   const queryUtils = useQueryUtils();
 *
 *   const handleAddToCart = async () => {
 *     // ... add to cart logic
 *     await queryUtils.invalidateShopCart(shopId);
 *   };
 *
 *   const handlePrefetchShop = () => {
 *     queryUtils.prefetchShop(shopId);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleAddToCart}>Add to Cart</button>
 *       <button onClick={handlePrefetchShop}>Prefetch Shop</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Usage in mutation hooks
 * function useAddToCart() {
 *   const queryUtils = useQueryUtils();
 *
 *   return useMutation({
 *     mutationFn: addToCartAPI,
 *     onSuccess: (data, variables) => {
 *       // Invalidate specific shop cart
 *       queryUtils.invalidateShopCart(variables.shopId);
 *
 *       // Optionally invalidate all carts
 *       queryUtils.invalidateAllCarts();
 *     }
 *   });
 * }
 * ```
 *
 * @remarks
 * **Key Features:**
 * - **Cache Invalidation:** Targeted invalidation for specific data domains
 * - **Prefetching:** Optimistic data loading for improved UX
 * - **Cache Manipulation:** Direct cache data access and modification
 * - **Type Safety:** Full TypeScript support with query key integration
 *
 * **Performance Benefits:**
 * - Reduces redundant API calls through intelligent prefetching
 * - Improves perceived performance with cache-first strategies
 * - Enables optimistic updates for better user experience
 * - Provides fine-grained cache control for memory efficiency
 *
 * @see {@link queryKeys} for the underlying query key structure
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/QueryClient} QueryClient Reference
 *
 * @since 1.0.0
 */
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

/**
 * Utility class for centralized React Query cache management operations.
 *
 * Provides a comprehensive set of methods for managing query cache state including
 * invalidation, prefetching, and direct cache manipulation. This class wraps the
 * QueryClient with domain-specific methods that align with the application's data structure.
 *
 * @example
 * ```typescript
 * // Direct instantiation (rarely needed)
 * const queryClient = new QueryClient();
 * const queryUtils = new QueryUtils(queryClient);
 *
 * // Preferred usage via hook
 * function MyComponent() {
 *   const queryUtils = useQueryUtils();
 *
 *   const handleClearCache = () => {
 *     queryUtils.clearAllCache();
 *   };
 *
 *   return <button onClick={handleClearCache}>Clear Cache</button>;
 * }
 * ```
 *
 * @remarks
 * **Method Categories:**
 * - **Invalidation Methods:** `invalidate*` - Trigger cache updates
 * - **Prefetch Methods:** `prefetch*` - Preload data for better UX
 * - **Cache Access Methods:** `getCached*` - Direct cache data access
 * - **Cache Mutation Methods:** `setCached*` - Direct cache data modification
 * - **Utility Methods:** `clearAllCache` - Global cache operations
 *
 * **Best Practices:**
 * - Use invalidation methods after successful mutations
 * - Leverage prefetching for anticipated user navigation
 * - Use cached data access for optimistic updates
 * - Clear cache only when necessary (e.g., user logout)
 *
 * @param queryClient - The React Query client instance for cache operations
 *
 * @since 1.0.0
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
   * @example
   * ```typescript
   * // After user login to sync cart across devices
   * const handleLogin = async (credentials) => {
   *   await loginUser(credentials);
   *   queryUtils.invalidateAllCarts();
   * };
   * ```
   *
   * @returns Promise that resolves when invalidation is complete
   *
   * @see {@link invalidateShopCart} for shop-specific cart invalidation
   * @see {@link queryKeys.cart.all} for the underlying query key
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // After adding item to specific shop's cart
   * const handleAddToCart = async (shopId: string, productId: string) => {
   *   await addToCart({ shopId, productId });
   *   queryUtils.invalidateShopCart(shopId);
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop whose cart should be invalidated
   * @returns Promise that resolves when invalidation is complete
   *
   * @see {@link invalidateAllCarts} for global cart invalidation
   * @see {@link queryKeys.cart.byShop} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // After bulk order status update
   * const handleBulkOrderUpdate = async (orderIds: string[]) => {
   *   await updateMultipleOrders(orderIds);
   *   queryUtils.invalidateAllOrders();
   * };
   * ```
   *
   * @returns Promise that resolves when invalidation is complete
   *
   * @see {@link invalidateUserOrders} for user-specific order invalidation
   * @see {@link invalidateSellerOrders} for seller-specific order invalidation
   * @see {@link queryKeys.orders.all} for the underlying query key
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // After user places a new order
   * const handlePlaceOrder = async (userId: string, orderData: Order) => {
   *   await createOrder(orderData);
   *   queryUtils.invalidateUserOrders(userId);
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user whose orders should be invalidated
   * @returns Promise that resolves when invalidation is complete
   *
   * @see {@link invalidateAllOrders} for global order invalidation
   * @see {@link queryKeys.users.orders} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // After seller updates order status
   * const handleOrderStatusUpdate = async (orderId: string, status: OrderStatus) => {
   *   await updateOrderStatus(orderId, status);
   *   queryUtils.invalidateSellerOrders();
   * };
   * ```
   *
   * @returns Promise that resolves when invalidation is complete
   *
   * @see {@link invalidateAllOrders} for global order invalidation
   * @see {@link queryKeys.seller.orders} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // After seller adds new product to shop
   * const handleAddProduct = async (shopId: string, productData: Product) => {
   *   await createProduct(productData);
   *   queryUtils.invalidateShopProducts(shopId);
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop whose products should be invalidated
   * @returns Promise that resolves when invalidation is complete
   *
   * @see {@link prefetchShopProducts} for prefetching shop products
   * @see {@link queryKeys.shops.products} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // During user logout
   * const handleLogout = async () => {
   *   await logoutUser();
   *   queryUtils.clearAllCache();
   *   router.push('/login');
   * };
   * ```
   *
   * @returns Promise that resolves when cache clearing is complete
   *
   * @warning This operation cannot be undone and will trigger refetch for all subsequent queries
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Prefetch shop when user hovers over shop link
   * const handleShopLinkHover = (shopId: string) => {
   *   queryUtils.prefetchShop(shopId);
   * };
   *
   * // Prefetch multiple shops for search results
   * const handleSearchResults = (shops: Shop[]) => {
   *   shops.forEach(shop => queryUtils.prefetchShop(shop.id));
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop to prefetch
   * @returns Promise that resolves when prefetching is complete
   *
   * @see {@link getCachedShop} for accessing prefetched shop data
   * @see {@link queryKeys.shops.detail} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Prefetch products when user navigates to shop category
   * const handleCategorySelect = (shopId: string) => {
   *   queryUtils.prefetchShopProducts(shopId);
   * };
   *
   * // Prefetch during shop page component mount
   * useEffect(() => {
   *   if (shopId) {
   *     queryUtils.prefetchShopProducts(shopId);
   *   }
   * }, [shopId]);
   * ```
   *
   * @param shop_id - The unique identifier of the shop whose products should be prefetched
   * @returns Promise that resolves when prefetching is complete
   *
   * @see {@link invalidateShopProducts} for invalidating shop product cache
   * @see {@link queryKeys.shops.products} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Check if shop data is available before rendering
   * const ShopPreview = ({ shopId }: { shopId: string }) => {
   *   const queryUtils = useQueryUtils();
   *   const cachedShop = queryUtils.getCachedShop(shopId);
   *
   *   if (cachedShop) {
   *     return <div>Shop: {cachedShop.name}</div>;
   *   }
   *
   *   return <div>Loading shop...</div>;
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop to retrieve from cache
   * @returns The cached shop data or undefined if not available
   *
   * @see {@link prefetchShop} for loading shop data into cache
   * @see {@link queryKeys.shops.detail} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Get current cart state for optimistic updates
   * const handleOptimisticCartAdd = (shopId: string, product: Product) => {
   *   const currentCart = queryUtils.getCachedCart(shopId);
   *   const optimisticCart = [...(currentCart || []), product];
   *
   *   queryUtils.setCachedCart(shopId, optimisticCart);
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop whose cart should be retrieved
   * @returns The cached cart data or undefined if not available
   *
   * @see {@link setCachedCart} for updating cached cart data
   * @see {@link invalidateShopCart} for invalidating cart cache
   * @see {@link queryKeys.cart.byShop} for the underlying query key factory
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Optimistic cart update during add to cart
   * const handleOptimisticAdd = async (shopId: string, product: Product) => {
   *   const currentCart = queryUtils.getCachedCart(shopId) || [];
   *   const newCart = [...currentCart, product];
   *
   *   // Optimistic update
   *   queryUtils.setCachedCart(shopId, newCart);
   *
   *   try {
   *     await addToCartAPI({ shopId, productId: product.id });
   *   } catch (error) {
   *     // Rollback on error
   *     queryUtils.setCachedCart(shopId, currentCart);
   *     throw error;
   *   }
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop whose cart should be updated
   * @param data - The new cart data to store in cache
   * @returns The updated cache data
   *
   * @see {@link getCachedCart} for retrieving cached cart data
   * @see {@link invalidateShopCart} for invalidating cart cache
   * @see {@link queryKeys.cart.byShop} for the underlying query key factory
   *
   * @warning Direct cache manipulation can lead to inconsistencies if not properly managed
   *
   * @since 1.0.0
   */
  setCachedCart(shop_id: string, data: any) {
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
 * @example
 * ```typescript
 * // Basic usage in a component
 * function ShopPage({ shopId }: { shopId: string }) {
 *   const queryUtils = useQueryUtils();
 *
 *   const handleRefreshShop = () => {
 *     queryUtils.invalidateShopProducts(shopId);
 *   };
 *
 *   const handlePrefetchProducts = () => {
 *     queryUtils.prefetchShopProducts(shopId);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleRefreshShop}>Refresh Products</button>
 *       <button onClick={handlePrefetchProducts}>Prefetch Products</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Usage in custom hooks
 * function useOptimisticCartUpdate(shopId: string) {
 *   const queryUtils = useQueryUtils();
 *
 *   return useCallback((product: Product) => {
 *     const currentCart = queryUtils.getCachedCart(shopId) || [];
 *     const newCart = [...currentCart, product];
 *     queryUtils.setCachedCart(shopId, newCart);
 *   }, [shopId, queryUtils]);
 * }
 * ```
 *
 * @returns A QueryUtils instance for the current React Query client
 *
 * @see {@link QueryUtils} for available utility methods
 * @see {@link useQueryClient} for direct QueryClient access
 *
 * @since 1.0.0
 */
export function useQueryUtils() {
  const queryClient = useQueryClient();
  return new QueryUtils(queryClient);
}
