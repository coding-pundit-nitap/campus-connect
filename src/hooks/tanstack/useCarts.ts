"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { upsertCartItem } from "@/actions";
import { queryKeys } from "@/lib/query-keys";
import { cartAPIService } from "@/services/api";
import { SerializedFullCart } from "@/types";

export function useCartForShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.cart.byShop(shopId),
    queryFn: () => cartAPIService.fetchCartForShop(shopId),
    enabled: !!shopId,
  });
}

export function useUpsertCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCartItem,
    onSuccess: (data: SerializedFullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);

      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.all,
      });
    },
    onError: (error) => {
      console.error("Failed to update cart:", error);
      toast.error("Failed to update cart. Please try again.");
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCartItem,
    onMutate: async ({ product_id, quantity }) => {
      const allQueries = queryClient.getQueriesData({
        queryKey: queryKeys.cart.all,
      });
      const shop_id = allQueries.find(
        ([key]) => key[0] === queryKeys.cart.byShop(product_id)
      )?.[0]?.[1];
      if (!shopId) return { productId, quantity };
      return { productId, quantity };
    },
    onSuccess: (data: SerializedFullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      toast.success(`Added ${data.items.length} item(s) to cart`);
    },
    onError: (error) => {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    },
  });
}

export function useGetUserAllCart() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: cartAPIService.fetchAllUserCarts,
    enabled: !!session?.user?.id,
  });
}
