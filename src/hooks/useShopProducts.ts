"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { productAPIService, shopAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * Hook to fetch shop details by shop ID with conditional query execution and automatic caching.
 *
 * This hook provides reactive access to comprehensive shop information including
 * shop metadata, seller details, and basic shop statistics. It's designed for
 * shop profile pages, shop directories, and any component that needs to display
 * or interact with specific shop information.
 *
 * @param shop_id - The unique identifier of the shop to fetch details for
 * @returns UseQueryResult containing shop details, loading state, and error information
 *
 */
export function useShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.shops.detail(shop_id),
    queryFn: () => shopAPIService.fetchShop({ shop_id: shop_id }),
    enabled: !!shop_id,
  });
}

/**
 * Hook to fetch shop products with infinite scrolling and cursor-based pagination.
 *
 * This hook provides efficient access to a shop's product catalog using infinite
 * scrolling patterns. It's optimized for large product catalogs and provides
 * seamless pagination through cursor-based loading. Perfect for shop pages,
 * product listings, and any interface where users browse through shop inventories.
 *
 * @param shop_id - The unique identifier of the shop to fetch products for
 * @returns UseInfiniteQueryResult containing paginated product data, loading states, and pagination controls
 *
 */
export const useShopProducts = (shop_id: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.shops.products(shop_id),
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({ shop_id, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!shop_id,
  });
};

/**
 * Hook to fetch shop products as a flattened array with additional convenience properties.
 *
 * This hook builds upon useShopProducts to provide a simplified interface for
 * components that need access to all shop products as a single flat array rather
 * than paginated data. It automatically flattens the infinite query results and
 * provides additional computed properties for easier product catalog management.
 *
 * @param shop_id - The unique identifier of the shop to fetch products for
 * @returns Enhanced query result with flattened products array and convenience properties
 *
 */
export function useShopProductsFlat(shop_id: string) {
  const query = useShopProducts(shop_id);

  const products = query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    products,
    hasProducts: products.length > 0,
    totalProducts: products.length,
  };
}
