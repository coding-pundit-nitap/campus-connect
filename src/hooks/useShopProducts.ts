"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { productAPIService, shopAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

export function useShop(shopId: string) {
  return useQuery({
    queryKey: queryKeys.shops.detail(shopId),
    queryFn: () => shopAPIService.fetchShop({ shop_id: shopId }),
    enabled: !!shopId,
  });
}

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

export function useShopProductsFlat(shopId: string) {
  const query = useShopProducts(shopId);

  const products = query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    products,
    hasProducts: products.length > 0,
    totalProducts: products.length,
  };
}
