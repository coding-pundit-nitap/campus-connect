"use client";
import { useCallback, useMemo, useState } from "react";

import { ShopProductsFilters, useShopProducts } from "@/hooks/queries";
import { SerializedProduct } from "@/types/product.types";

export interface ProductFiltersState {
  search: string;
  categoryId: string | null;
  inStock: boolean | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const createDefaultFilterState = (): ProductFiltersState => ({
  search: "",
  categoryId: null,
  inStock: null,
  sortBy: "created_at",
  sortOrder: "desc",
});

export const useProducts = (shop_id: string) => {
  const [filters, setFilters] = useState<ProductFiltersState>(
    createDefaultFilterState()
  );

  // Convert filter state to API params (only include non-default values)
  const apiFilters = useMemo((): ShopProductsFilters => {
    const params: ShopProductsFilters = {
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
    if (filters.search) params.search = filters.search;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.inStock !== null) params.inStock = filters.inStock;
    return params;
  }, [filters]);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useShopProducts(shop_id, apiFilters);

  const allProducts: SerializedProduct[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.categoryId !== null ||
      filters.inStock !== null
    );
  }, [filters]);

  const updateFilter = useCallback((update: Partial<ProductFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultFilterState());
  }, []);

  const updateSearch = useCallback(
    (search: string) => updateFilter({ search }),
    [updateFilter]
  );

  const updateStockFilter = useCallback(
    (inStock: boolean | null) => updateFilter({ inStock }),
    [updateFilter]
  );
  const updateCategoryFilter = useCallback(
    (categoryId: string | null) => updateFilter({ categoryId }),
    [updateFilter]
  );
  const updateSort = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") =>
      updateFilter({ sortBy, sortOrder }),
    [updateFilter]
  );
  const clearSearchFilter = useCallback(
    () => updateFilter({ search: "" }),
    [updateFilter]
  );
  const clearStockFilter = useCallback(
    () => updateFilter({ inStock: null }),
    [updateFilter]
  );
  const clearCategoryFilter = useCallback(
    () => updateFilter({ categoryId: null }),
    [updateFilter]
  );

  const isEmpty = allProducts.length === 0;

  return {
    allProducts,
    displayProducts: allProducts,
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
    updateStockFilter,
    updateCategoryFilter,
    updateSort,
    clearSearchFilter,
    clearStockFilter,
    clearCategoryFilter,
  };
};
