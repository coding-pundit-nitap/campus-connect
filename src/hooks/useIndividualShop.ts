"use client";
import { useMemo } from "react";

import { productUIServices } from "@/lib/utils-functions";

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

  const shopState = useMemo(
    () => ({
      showFilters: allProducts.length > 0,
      showNoMatchMessage: hasActiveFilters && displayProducts.length === 0,
      productCountMessage: productUIServices.getProductCountMessage(
        displayProducts.length,
        allProducts.length
      ),
    }),
    [allProducts.length, displayProducts.length, hasActiveFilters]
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
  };
};
