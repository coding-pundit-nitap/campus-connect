"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { productUIServices } from "@/lib/utils-functions";

import { useAddToCart } from "./tanstack";
import { useProducts } from "./useProduct";

export const useIndividualShop = (shop_id: string) => {
  const router = useRouter();
  const {
    allProducts,
    displayProducts,
    isEmpty,
    isLoading,
    isError,
    error,
    hasActiveFilters,
    clearFilters,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProducts(shop_id);
  const { mutate: onAddToCartAction, isPending: isAddingToCart } =
    useAddToCart();

  const shopState = useMemo(
    () => ({
      showFilters: allProducts.length > 0,
      showNoMatchMessage: hasActiveFilters && displayProducts.length === 0,
      productCountMessage: productUIServices.getProductCountMessage(
        displayProducts.length,
        allProducts.length
      ),
      onAddToCart: (product_id: string, quantity: number) => {
        onAddToCartAction({ product_id, quantity });
      },
      onViewDetails: (product_id: string) => {
        router.push(`/shops/${shop_id}/products/${product_id}`);
      },
    }),
    [
      allProducts.length,
      displayProducts.length,
      hasActiveFilters,
      onAddToCartAction,
      router,
      shop_id,
    ]
  );

  const actionHandlers = useMemo(
    () => ({
      onResetFilters: clearFilters,
    }),
    [clearFilters]
  );

  const loadingStates = useMemo(
    () => ({
      isInitialLoading: isLoading && isEmpty,
      hasError: isError && !!error,
      isEmptyState: !isLoading && isEmpty,
    }),
    [isLoading, isEmpty, isError, error]
  );

  return {
    allProducts,
    displayProducts,
    ...shopState,
    ...loadingStates,
    hasActiveFilters,
    ...actionHandlers,
    error,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isAddingToCart,
  };
};
