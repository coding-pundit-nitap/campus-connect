"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { updateProductAction } from "@/actions";
import { queryKeys } from "@/lib/query-keys";
import { productAPIService, shopAPIService } from "@/services";
import { ProductFormData } from "@/validations/product";

/**
 * Fetches details for a specific shop by its ID.
 * - Returns shop metadata, seller info, and stats.
 * - Query runs only if shop_id is provided.
 *
 * @param shop_id Shop identifier
 * @returns React Query result with shop details
 */
export function useShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.shops.detail(shop_id),
    queryFn: () => shopAPIService.fetchShop({ shop_id }),
    enabled: !!shop_id,
  });
}

/**
 * Fetches products for a shop with infinite scrolling (cursor-based pagination).
 * - Useful for large catalogs and product listings.
 * - Returns paginated product data and controls for loading more.
 *
 * @param shop_id Shop identifier
 * @returns Infinite Query result with paginated products
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
 * Provides all shop products as a flat array, plus convenience properties.
 * - Flattens paginated results from useShopProducts.
 * - Adds total count and presence flag.
 *
 * @param shop_id Shop identifier
 * @returns Query result with flat products array and helpers
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

/**
 * Fetches all shops associated with the current user.
 * - Runs only if user session is available.
 *
 * @returns React Query result with user's shops
 */
export function useShopByUser() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.shops.byUser(),
    queryFn: () => shopAPIService.fetchShopsByUser(),
    enabled: !!session?.user.id,
  });
}

export function useShopProductsUpdate(product_id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      formData: Omit<ProductFormData, "image_url"> & {
        image_url: string | null;
      }
    ) => updateProductAction(product_id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product_id),
      });
    },
  });
}
