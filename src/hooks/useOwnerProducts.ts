"use client";
import { useMemo } from "react";

import { SerializedProduct } from "@/types/product.types";

import { useShopProducts } from "./tanstack";
import { useProductFilters } from "./useProductFilters";

export const useOwnerProducts = (shop_id: string) => {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useShopProducts(shop_id);

  const allProducts: SerializedProduct[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const {
    filters,
    filteredProducts,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useProductFilters(allProducts);

  const isEmpty = allProducts.length === 0;
  const displayProducts = hasActiveFilters ? filteredProducts : allProducts;

  return {
    allProducts,
    displayProducts,
    isEmpty,

    isLoading,
    isError,
    error,

    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,

    filters,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  };
};
