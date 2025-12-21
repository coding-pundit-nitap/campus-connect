"use client";
import { useCallback, useMemo, useState } from "react";

import { SerializedProduct } from "@/types/product.types";

import { ShopProductsFilters, useShopProducts } from "../queries";

export interface OwnerProductFiltersState {
  search: string;
  categoryId: string | null;
  inStock: boolean | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const createDefaultFilterState = (): OwnerProductFiltersState => ({
  search: "",
  categoryId: null,
  inStock: null,
  sortBy: "created_at",
  sortOrder: "desc",
});

export const useOwnerProducts = (shop_id: string) => {
  const [filters, setFilters] = useState<OwnerProductFiltersState>(
    createDefaultFilterState()
  );

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

  const updateFilter = useCallback(
    (update: Partial<OwnerProductFiltersState>) => {
      setFilters((prev) => ({ ...prev, ...update }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(createDefaultFilterState());
  }, []);

  const updateSearch = useCallback(
    (search: string) => updateFilter({ search }),
    [updateFilter]
  );
  const updatePriceRange = useCallback(() => {}, []);
  const updateStockFilter = useCallback(
    (inStock: boolean | null) => updateFilter({ inStock }),
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
  const clearPriceFilter = useCallback(() => {}, []);
  const clearStockFilter = useCallback(
    () => updateFilter({ inStock: null }),
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
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  };
};
