import { useMemo } from "react";

import { productUIServices } from "@/lib/utils-functions";

import { useShopProductsDelete } from "./tanstack";
import { useOwnerProducts } from "./useOwnerProducts";

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
  } = useOwnerProducts(shop_id);
  const { mutate: deleteProduct } = useShopProductsDelete();

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
      onDeleteProduct: deleteProduct,
      onResetFilters: clearFilters,
    }),
    [clearFilters, deleteProduct]
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
  };
};
