import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { FullCart } from "@/services/cart.services";

export function useCartForShop(shopId: string) {
  return useQuery({
    queryKey: queryKeys.cart.byShop(shopId),
    queryFn: () => cartAPIService.fetchCartForShop(shopId),
    enabled: !!shopId,
  });
}

export function useUpsertCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartAPIService.upsertCartItem(productId, quantity),
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

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartAPIService.upsertCartItem(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      const allQueries = queryClient.getQueriesData({
        queryKey: queryKeys.cart.all,
      });
      const shopId = allQueries.find(
        ([key]) => key[0] === queryKeys.cart.byShop(productId)
      )?.[0]?.[1];
      if (!shopId) return { productId, quantity };
      return { productId, quantity };
    },
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
    onError: (error, variables, context) => {
      console.error("Failed to add to cart:", error);
    },
  });
}


export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId }: { productId: string }) =>
      cartAPIService.upsertCartItem(productId, 0),
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}
