import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export class QueryUtils {
  constructor(private queryClient: QueryClient) {}

  invalidateAllCarts() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.cart.all,
    });
  }

  invalidateShopCart(shopId: string) {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.cart.byShop(shopId),
    });
  }

  invalidateAllOrders() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.orders.all,
    });
  }

  invalidateUserOrders(userId: string) {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.users.orders(userId),
    });
  }

  invalidateSellerOrders() {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.seller.orders(),
    });
  }

  invalidateShopProducts(shopId: string) {
    return this.queryClient.invalidateQueries({
      queryKey: queryKeys.shops.products(shopId),
    });
  }

  clearAllCache() {
    return this.queryClient.clear();
  }

  async prefetchShop(shopId: string) {
    const { shopAPIService } = await import("@/services/api");

    return this.queryClient.prefetchQuery({
      queryKey: queryKeys.shops.detail(shopId),
      queryFn: () => shopAPIService.fetchShop({ shop_id: shopId }),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }

  async prefetchShopProducts(shopId: string) {
    const { productAPIService } = await import("@/services/api");

    return this.queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.shops.products(shopId),
      queryFn: ({ pageParam }) =>
        productAPIService.fetchShopProducts({
          shop_id: shopId,
          cursor: pageParam as string | null,
        }),
      initialPageParam: null,
      staleTime: 1000 * 60 * 5,
    });
  }

  getCachedShop(shopId: string) {
    return this.queryClient.getQueryData(queryKeys.shops.detail(shopId));
  }

  getCachedCart(shopId: string) {
    return this.queryClient.getQueryData(queryKeys.cart.byShop(shopId));
  }

  setCachedCart(shopId: string, data: any) {
    return this.queryClient.setQueryData(queryKeys.cart.byShop(shopId), data);
  }
}

export function useQueryUtils() {
  const queryClient = useQueryClient();
  return new QueryUtils(queryClient);
}
