"use client";
import { useMemo } from "react";

import { productUIServices } from "@/lib/utils";

import { useImageDelete, useShopProductsDelete } from "../queries";
import { useOwnerProducts } from "../ui/useOwnerProducts";

export const useOwnedShop = (shop_id: string) => {
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
    filters,
    updateFilter,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useOwnerProducts(shop_id);
  const { mutate: deleteProduct } = useShopProductsDelete();
  const { mutateAsync: deleteImage } = useImageDelete();

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
      onDeleteProduct: async (product_id: string, image_key: string) => {
        await deleteImage(image_key);
        deleteProduct({ product_id, shop_id });
      },
      onResetFilters: clearFilters,
    }),
    [clearFilters, deleteProduct, deleteImage, shop_id]
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
    filters,
    updateFilter,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  };
};
