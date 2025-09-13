"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { productUIServices } from "@/lib/utils-functions";

import { useAddToCart } from "./tanstack";
import { useProducts } from "./useProduct";

export const useIndividualShop = (shop_id: string) => {
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
  const router = useRouter();

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
    }),
    [
      allProducts.length,
      displayProducts.length,
      hasActiveFilters,
      onAddToCartAction,
    ]
  );

  const actionHandlers = useMemo(
    () => ({
      onResetFilters: clearFilters,
      onViewDetails: (product_id: string) => {
        router.push(`/shops/${shop_id}/products/${product_id}`);
      },
    }),
    [clearFilters, router, shop_id]
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
