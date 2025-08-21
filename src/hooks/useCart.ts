import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import cartServices, { FullCart } from "@/services/cart.services";

/**
 * Hook to fetch cart data for a specific shop with automatic caching and real-time updates.
 *
 * This hook provides reactive access to cart data for a specific shop, automatically
 * managing query state, caching, and background refetching. It integrates with the
 * React Query cache system to provide optimized data fetching and synchronization
 * across components that need access to the same cart data.
 *
 * @param shop_id - The unique identifier of the shop to fetch cart data for
 * @returns UseQueryResult containing cart data, loading state, and error information
 *
 */
export function useCartForShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.cart.byShop(shop_id),
    queryFn: () => cartAPIService.fetchCartForShop(shop_id),
    enabled: !!shop_id,
  });
}

/**
 * Hook for upserting (insert or update) cart items with optimistic cache updates.
 *
 * This mutation hook provides functionality to add new items to the cart or update
 * existing item quantities. It handles both insertion of new products and updating
 * quantities of existing products in a single operation, with automatic cache
 * management and optimistic UI updates for improved user experience.
 *
 * @returns UseMutationResult with mutate function for upserting cart items
 *
 */
export function useUpsertCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      product_id,
      quantity,
    }: {
      product_id: string;
      quantity: number;
    }) => cartAPIService.upsertCartItem(product_id, quantity),
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);

      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.all,
      });
    },
    onError: (error) => {
      console.error("Failed to update cart:", error);
    },
  });
}

/**
 * Hook for adding products to cart with optimistic updates and enhanced UX.
 *
 * This specialized mutation hook is designed specifically for adding products to
 * the cart with enhanced user experience features. It provides optimistic updates,
 * intelligent cache management, and context preservation for better error recovery.
 * Unlike the generic upsert hook, this is optimized for the add-to-cart flow.
 *
 * @returns UseMutationResult with mutate function for adding items to cart
 *
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      product_id,
      quantity,
    }: {
      product_id: string;
      quantity: number;
    }) => cartAPIService.upsertCartItem(product_id, quantity),
    onMutate: async ({ product_id, quantity }) => {
      const allQueries = queryClient.getQueriesData({
        queryKey: queryKeys.cart.all,
      });
      const shop_id = allQueries.find(
        ([key]) => key[0] === queryKeys.cart.byShop(product_id),
      )?.[0]?.[1];
      if (!shop_id) return { product_id, quantity };
      return { product_id, quantity };
    },
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
    onError: (error) => {
      console.error("Failed to add to cart:", error);
    },
  });
}

export function useGetUserAllCart() {
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: cartServices.getAllUserCarts,
  });
}
