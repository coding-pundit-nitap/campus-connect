"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { upsertCartItem } from "@/actions";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { cartAPIService } from "@/services/cart";
import { SerializedFullCart } from "@/types";

export function useUpsertCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCartItem,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all });

      const previousAllCarts = queryClient.getQueryData<SerializedFullCart[]>(
        queryKeys.cart.all
      );

      let targetShopId: string | null = null;
      let previousShopCart: SerializedFullCart | null = null;

      previousAllCarts?.map((cart) => {
        const hasProduct = cart.items.some(
          (item) => item.product_id === variables.product_id
        );
        if (hasProduct) {
          targetShopId = cart.shop_id;
          previousShopCart =
            queryClient.getQueryData(queryKeys.cart.byShop(targetShopId)) ??
            null;

          let optimisticCart: SerializedFullCart;

          if (variables.quantity === 0) {
            optimisticCart = {
              ...cart,
              items: cart.items.filter(
                (item) => item.product_id !== variables.product_id
              ),
            };
          } else {
            const existingItemIndex = cart.items.findIndex(
              (item) => item.product_id === variables.product_id
            );

            if (existingItemIndex >= 0) {
              optimisticCart = {
                ...cart,
                items: cart.items.map((item, index) =>
                  index === existingItemIndex
                    ? { ...item, quantity: variables.quantity }
                    : item
                ),
              };
            } else {
              optimisticCart = cart;
            }
          }

          queryClient.setQueryData(
            queryKeys.cart.byShop(targetShopId),
            optimisticCart
          );

          queryClient.setQueryData<SerializedFullCart[]>(
            queryKeys.cart.all,
            (oldData) => {
              if (!oldData) {
                return oldData;
              }
              return oldData.map((c) =>
                c.shop_id === targetShopId ? optimisticCart : c
              );
            }
          );
          return;
        }
      });

      return {
        previousAllCarts,
        previousShopCart,
        targetShopId,
        product_id: variables.product_id,
        quantity: variables.quantity,
      };
    },
    onSuccess: (data: SerializedFullCart, variables) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.setQueryData<SerializedFullCart[]>(
        queryKeys.cart.all,
        (oldData) => {
          if (!oldData) {
            return data.items.length > 0 ? [data] : [];
          }

          const existingCartIndex = oldData.findIndex(
            (cart) => cart.shop_id === data.shop_id
          );

          if (existingCartIndex >= 0) {
            const newData = [...oldData];
            if (data.items.length === 0) {
              newData.splice(existingCartIndex, 1);
            } else {
              newData[existingCartIndex] = data;
            }
            return newData;
          } else if (data.items.length > 0) {
            return [...oldData, data];
          }

          return oldData;
        }
      );

      if (variables.quantity === 0) {
        toast.dismiss();
        toast.success("Item removed from cart");
      } else {
        const totalItems = data.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        toast.dismiss();
        toast.success(`Cart updated (${totalItems} items)`);
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousAllCarts) {
        queryClient.setQueryData(queryKeys.cart.all, context.previousAllCarts);
      }

      if (context?.targetShopId && context?.previousShopCart) {
        queryClient.setQueryData(
          queryKeys.cart.byShop(context.targetShopId),
          context.previousShopCart
        );
      }

      const action = variables.quantity === 0 ? "remove item from" : "update";
      toast.dismiss();
      toast.error(`Failed to ${action} cart. Please try again.`);
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCartItem,
    onMutate: async ({ product_id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all });

      const allCartsData = queryClient.getQueryData<SerializedFullCart[]>(
        queryKeys.cart.all
      );

      const targetShopId = allCartsData?.find((cart) => {
        const hasProduct = cart.items.some(
          (item) => item.product_id === product_id
        );
        if (hasProduct) {
          return cart.shop_id;
        }
      })?.shop_id;

      return {
        previousAllCarts: allCartsData,
        previousShopCart: targetShopId
          ? queryClient.getQueryData<SerializedFullCart>(
              queryKeys.cart.byShop(targetShopId)
            )
          : null,
        targetShopId,
        product_id,
        quantity,
      };
    },
    onSuccess: (data: SerializedFullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);

      queryClient.setQueryData<SerializedFullCart[]>(
        queryKeys.cart.all,
        (oldData) => {
          if (!oldData) {
            return [data];
          }

          const existingCartIndex = oldData.findIndex(
            (cart) => cart.shop_id === data.shop_id
          );
          if (existingCartIndex >= 0) {
            const newData = [...oldData];
            newData[existingCartIndex] = data;
            return newData;
          } else {
            return [...oldData, data];
          }
        }
      );

      const itemCount = data.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      toast.dismiss();
      toast.success(`Added to cart (${itemCount} items total)`);
    },
    onError: (error, variables, context) => {
      if (context?.previousAllCarts) {
        queryClient.setQueryData(queryKeys.cart.all, context.previousAllCarts);
      }
      if (context?.targetShopId && context?.previousShopCart) {
        queryClient.setQueryData(
          queryKeys.cart.byShop(context.targetShopId),
          context.previousShopCart
        );
      }

      toast.dismiss();
      toast.error("Failed to add to cart. Please try again.");
    },
  });
}

export function useGetUserAllCart() {
  const { data } = useSession();

  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: cartAPIService.fetchAllUserCarts,
    enabled: !!data?.user,
  });
}

export function useGetCartByShop(shop_id: string) {
  const { data } = useSession();

  return useQuery({
    queryKey: queryKeys.cart.byShop(shop_id),
    queryFn: () => cartAPIService.fetchCartForShop(shop_id),
    enabled: !!data && !!shop_id,
  });
}
