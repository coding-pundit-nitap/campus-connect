export const queryKeys = {
  users: {
    all: ["users"] as const,
    orders: (userId: string) => ["users", userId, "orders"] as const,
    profile: (userId: string) => ["users", userId, "profile"] as const,
  },

  cart: {
    all: ["cart"] as const,
    byShop: (shopId: string) => ["cart", "shop", shopId] as const,
  },

  shops: {
    all: ["shops"] as const,
    detail: (shopId: string) => ["shops", shopId] as const,
    products: (shopId: string, cursor?: string | null) =>
      ["shops", shopId, "products", { cursor }] as const,
  },

  products: {
    all: ["products"] as const,
    byShop: (shopId: string) => ["products", "shop", shopId] as const,
    detail: (productId: string) => ["products", productId] as const,
  },

  orders: {
    all: ["orders"] as const,
    byUser: (userId: string) => ["orders", "user", userId] as const,
    byShop: (shopId: string) => ["orders", "shop", shopId] as const,
    detail: (orderId: string) => ["orders", orderId] as const,
  },

  seller: {
    all: ["seller"] as const,
    orders: () => ["seller", "orders"] as const,
    dashboard: () => ["seller", "dashboard"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
