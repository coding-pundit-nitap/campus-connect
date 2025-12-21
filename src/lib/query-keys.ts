import { DateRange } from "react-day-picker";

import { OrderStatus } from "@/types/prisma.types";

/**
 * Centralized query key factory for React Query cache management in the campus connect application.
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
    me: ["users", "me"],
    /** User favorite shops */
    favorites: ["users", "favorites"] as const,
    /** User stock watches */
    stockWatches: ["users", "stock-watches"] as const,
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
    products: (shop_id: string) => ["shops", shop_id, "products"] as const,
    /** Shop-specific categories query key factory */
    categories: (query: string) => ["shops", "categories", { query }] as const,
    byUser: () => ["shops", "user", "current"] as const,
  },

  /**
   * Product catalog query keys for product management and browsing.
   */
  products: {
    all: ["products"] as const,
    /** Query key for paginated product lists with optional filters */
    list: (filters: { limit?: number }) =>
      ["products", "list", filters] as const,
    /** Products filtered by shop query key factory */
    byShop: (shop_id: string) => ["products", "shop", shop_id] as const,
    /** Products filtered by shop with additional filters */
    byShopWithFilters: (
      shop_id: string,
      filters?: {
        sortBy?: string;
        sortOrder?: string;
        categoryId?: string;
        search?: string;
        inStock?: boolean;
      }
    ) => ["products", "shop", shop_id, "filtered", filters] as const,
    /** Individual product details query key factory */
    detail: (product_id: string) => ["products", product_id] as const,
    reviews: (product_id: string) =>
      ["products", product_id, "reviews"] as const,
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
    /** Search query key factory for order search  */
    orders: (
      searchTerm: string,
      filters: { status?: OrderStatus; dateRange?: DateRange }
    ) => ["search", "orders", searchTerm, filters] as const,
  },

  /**
   * Notification system query keys for real-time updates and messaging.
   */
  notifications: {
    all: ["notifications"] as const,
    history: () => ["notifications", "history"] as const,
    summary: () => ["notifications", "summary"] as const,
  },

  health: {
    all: ["health"] as const,
    database: () => ["health", "database"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
