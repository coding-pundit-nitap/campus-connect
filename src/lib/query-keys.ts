/**
 * Centralized query key factory for React Query cache management in the college connect application.
 *
 * This module provides a structured approach to query key generation for consistent cache
 * management across the application. It follows the hierarchical query key pattern recommended
 * by TanStack Query for optimal cache invalidation and data synchronization.
 *
 * @example
 * ```typescript
 * // Basic usage in React Query hooks
 * function useUserProfile(userId: string) {
 *   return useQuery({
 *     queryKey: queryKeys.users.profile(userId),
 *     queryFn: () => fetchUserProfile(userId)
 *   });
 * }
 *
 * // Cache invalidation after mutations
 * function useUpdateUser() {
 *   const queryClient = useQueryClient();
 *
 *   return useMutation({
 *     mutationFn: updateUserProfile,
 *     onSuccess: (data, variables) => {
 *       // Invalidate specific user profile
 *       queryClient.invalidateQueries({
 *         queryKey: queryKeys.users.profile(variables.userId)
 *       });
 *
 *       // Invalidate all user queries
 *       queryClient.invalidateQueries({
 *         queryKey: queryKeys.users.all
 *       });
 *     }
 *   });
 * }
 *
 * // Shop products with pagination
 * function useShopProducts(shopId: string, cursor?: string) {
 *   return useInfiniteQuery({
 *     queryKey: queryKeys.shops.products(shopId, cursor),
 *     queryFn: ({ pageParam }) => fetchShopProducts(shopId, pageParam)
 *   });
 * }
 * ```
 *
 * @see {@link https://tanstack.com/query/latest/docs/react/guides/query-keys} TanStack Query Key Guide
 * @see {@link useOptimisticUserUpdate} for cache manipulation examples
 * @see {@link useLoginUser} for authentication-related query usage
 *
 * @since 1.0.0
 */
export const queryKeys = {
  /**
   * User-related query keys for profile management, orders, and authentication.
   */
  users: {
    /** Base key for all user-related queries */
    all: ["users"] as const,
    /** User-specific orders query key factory */
    orders: (user_id: string) => ["users", user_id, "orders"] as const,
    /** User profile query key factory */
    profile: (user_id: string) => ["users", user_id, "profile"] as const,
  },

  /**
   * Shopping cart query keys for cart state management.
   *
   */
  cart: {
    /** Base key for all cart-related queries */
    all: ["cart"] as const,
    /** Shop-specific cart items query key factory */
    byShop: (shop_id: string) => ["cart", "shop", shop_id] as const,
  },

  /**
   * Shop-related query keys for shop information and product listings.
   */
  shops: {
    /** Base key for all shop-related queries */
    all: ["shops"] as const,
    /** Individual shop details query key factory */
    detail: (shop_id: string) => ["shops", shop_id] as const,
    /** Shop products with pagination support query key factory */
    products: (shop_id: string, cursor?: string | null) =>
      ["shops", shop_id, "products", { cursor }] as const,
  },

  /**
   * Product catalog query keys for product management and browsing.
   */
  products: {
    /** Base key for all product-related queries */
    all: ["products"] as const,
    /** Products filtered by shop query key factory */
    byShop: (shop_id: string) => ["products", "shop", shop_id] as const,
    /** Individual product details query key factory */
    detail: (product_id: string) => ["products", product_id] as const,
  },

  /**
   * Order management query keys for order processing and tracking.
   */
  orders: {
    /** Base key for all order-related queries */
    all: ["orders"] as const,
    /** User-specific order history query key factory */
    byUser: (user_id: string) => ["orders", "user", user_id] as const,
    /** Shop-specific order management query key factory */
    byShop: (shop_id: string) => ["orders", "shop", shop_id] as const,
    /** Individual order details query key factory */
    detail: (order_id: string) => ["orders", order_id] as const,
  },

  /**
   * Seller dashboard query keys for vendor management and analytics.
   */
  seller: {
    /** Base key for all seller-related queries */
    all: ["seller"] as const,
    /** Seller order management query key factory */
    orders: () => ["seller", "orders"] as const,
    /** Seller dashboard analytics query key factory */
    dashboard: () => ["seller", "dashboard"] as const,
  },
} as const;

/**
 * Type definition for the complete query keys structure.
 *
 * @example
 * ```typescript
 * // Type-safe query key usage
 * function createUserQuery(keys: QueryKeys['users']) {
 *   return useQuery({
 *     queryKey: keys.all,
 *     queryFn: fetchAllUsers
 *   });
 * }
 * ```
 */
export type QueryKeys = typeof queryKeys;
