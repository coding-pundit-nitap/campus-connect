/**
 * Centralized query key factory for React Query cache management in the college connect application.
 *
 * This module provides a structured approach to query key generation for consistent cache
 * management across the application. It follows the hierarchical query key pattern recommended
 * by TanStack Query for optimal cache invalidation and data synchronization.
 *
 */
export const queryKeys = {
  /**
   * User-related query keys for profile management, orders, and authentication.
   */
  users: {
    all: ["users"] as const,
    /** User-specific orders query key factory */
    orders: (user_id: string) => ["users", user_id, "orders"] as const,
    /** User profile query key factory */
    profile: (user_id: string) => ["users", user_id, "profile"] as const,
    /** User addresses query key factory */
    addresses: () => ["users", "addresses"] as const,
  },

  /**
   * Shopping cart query keys for cart state management.
   *
   */
  cart: {
    all: ["cart"] as const,
    byShop: (shopId: string) => ["cart", "shop", shopId] as const,
  },

  /**
   * Shop-related query keys for shop information and product listings.
   */
  shops: {
    all: ["shops"] as const,
    /** Individual shop details query key factory */
    detail: (shop_id: string) => ["shops", shop_id] as const,
    /** Shop-specific product listings with pagination */
    products: (shop_id: string, cursor?: string | null) =>
      ["shops", shop_id, "products", { cursor }] as const,
    /** Shop-specific categories query key factory */
    categories: (query: string) => ["shops", "categories", { query }] as const,
    byUser: () => ["shops", "user", "current"] as const,
  },

  /**
   * Product catalog query keys for product management and browsing.
   */
  products: {
    all: ["products"] as const,
    byShop: (shopId: string) => ["products", "shop", shopId] as const,
    detail: (productId: string) => ["products", productId] as const,
  },

  /**
   * Order management query keys for order processing and tracking.
   */
  orders: {
    all: ["orders"] as const,
    byUser: (userId: string) => ["orders", "user", userId] as const,
    byShop: (shopId: string) => ["orders", "shop", shopId] as const,
    detail: (orderId: string) => ["orders", orderId] as const,
  },

  /**
   * Seller dashboard query keys for vendor management and analytics.
   */
  seller: {
    all: ["seller"] as const,
    orders: () => ["seller", "orders"] as const,
    dashboard: () => ["seller", "dashboard"] as const,
  },

  search: {
    /** Base key for all search-related queries */
    all: ["search"] as const,
    /** Search query key factory for specific search terms */
    query: (searchTerm: string) => ["search", "query", searchTerm] as const,
    /** Search query key factory for product search  */
    products: (searchTerm: string) =>
      ["search", "products", searchTerm] as const,
  },

  health: {
    all: ["health"] as const,
    database: () => ["health", "database"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
