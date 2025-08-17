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
 * @remarks
 * **Query Key Structure:**
 * - Uses hierarchical structure for granular cache control
 * - Supports both static and parameterized query keys
 * - Follows consistent naming patterns across all domains
 * - Enables partial cache invalidation at any level
 *
 * **Cache Management Benefits:**
 * - **Precise Invalidation:** Target specific data subsets for updates
 * - **Optimistic Updates:** Easy cache manipulation with consistent keys
 * - **Background Refetching:** Automatic data freshness management
 * - **Memory Efficiency:** Structured cache organization reduces memory usage
 *
 * **Domain Organization:**
 * - **users:** User profiles, orders, and authentication data
 * - **cart:** Shopping cart state management
 * - **shops:** Shop information and associated products
 * - **products:** Product catalog and details
 * - **orders:** Order management for buyers and sellers
 * - **seller:** Seller-specific dashboard and analytics
 *
 * **Key Patterns:**
 * - `all`: Base key for entire domain (e.g., `["users"]`)
 * - `detail`: Specific entity by ID (e.g., `["products", "123"]`)
 * - `byX`: Related entities (e.g., `["orders", "user", "456"]`)
 * - `nested`: Sub-resources (e.g., `["shops", "789", "products"]`)
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
   *
   * @remarks
   * Handles user data caching including profiles, user-specific orders, and authentication state.
   * Supports both global user operations and user-specific data retrieval.
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
   * @remarks
   * Manages shopping cart data both globally and per-shop for multi-vendor support.
   * Enables efficient cart updates and synchronization across the application.
   */
  cart: {
    /** Base key for all cart-related queries */
    all: ["cart"] as const,
    /** Shop-specific cart items query key factory */
    byShop: (shop_id: string) => ["cart", "shop", shop_id] as const,
  },

  /**
   * Shop-related query keys for shop information and product listings.
   *
   * @remarks
   * Handles shop data including shop details, product catalogs, and shop-specific operations.
   * Supports pagination for product listings with cursor-based navigation.
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
   *
   * @remarks
   * Manages product data including global product lists, shop-specific products,
   * and individual product details for the marketplace functionality.
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
   *
   * @remarks
   * Handles order data for both buyers and sellers, including order details,
   * user order history, and shop order management functionality.
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
   *
   * @remarks
   * Provides seller-specific data caching for dashboard analytics, order management,
   * and seller portal functionality separate from general shop operations.
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
 * @remarks
 * Provides TypeScript type safety for all query key operations throughout the application.
 * Ensures consistent usage and prevents runtime errors from malformed query keys.
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
