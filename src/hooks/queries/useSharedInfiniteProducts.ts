"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useProductActions } from "@/hooks/common/useProductActions";
import { useProductFilters } from "@/hooks/ui/useProductFilters";
import { queryKeys } from "@/lib/query-keys";
import { getProductStates, productUIServices } from "@/lib/utils";
import { productAPIService } from "@/services/product";
import { ProductDataDetails, SerializedProduct } from "@/types/product.types";

type Props = {
  shop_id: string;
  mode: "owner" | "user";
  initialProducts: SerializedProduct[];
  initialProductStates: ProductDataDetails;
  initialHasNextPage: boolean;
  initialNextCursor: string | null;
  initialError?: string;
};

export const useSharedInfiniteProducts = ({
  shop_id,
  mode,
  initialProducts,
  initialHasNextPage,
  initialNextCursor,
  initialError,
}: Props) => {
  const {
    filters,
    updateFilter,
    clearFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useProductFilters();

  const hasActiveFilters = useMemo(() => {
    return productUIServices.hasActiveFilters(filters);
  }, [filters]);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      ...queryKeys.products.byShop(shop_id),
      filters.sortBy,
      filters.sortOrder,
      filters.categoryId,
      filters.search,
      filters.inStock,
    ],
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({
        shop_id,
        cursor: pageParam,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId ?? undefined,
        search: filters.search,
        inStock: filters.inStock ?? undefined,
      }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialProducts.length > 0 &&
      !hasActiveFilters &&
      filters.sortBy === "created_at" &&
      filters.sortOrder === "desc" &&
      !filters.categoryId &&
      !filters.search
        ? {
            pages: [
              {
                data: initialProducts,
                nextCursor: initialNextCursor,
              },
            ],
            pageParams: [null],
          }
        : undefined,
  });

  const allProducts: SerializedProduct[] = useMemo(() => {
    if (!data?.pages) {
      return initialProducts;
    }

    return data.pages.flatMap((page) => page.data);
  }, [data, initialProducts]);

  const displayProducts = allProducts;

  const productStates = useMemo(
    () =>
      getProductStates(
        allProducts,
        displayProducts,
        hasActiveFilters,
        isLoading
      ),
    [allProducts, displayProducts, hasActiveFilters, isLoading]
  );

  const { onDeleteProduct, onAddToCart, onViewDetails, isAddingToCart } =
    useProductActions({
      mode,
      shop_id,
    });

  const loadingStates = useMemo(
    () => ({
      isInitialLoading: isLoading && initialProducts.length === 0,
      hasError: isError || !!initialError,
      isEmptyState: !isLoading && allProducts.length === 0,
    }),
    [
      isLoading,
      initialProducts.length,
      isError,
      initialError,
      allProducts.length,
    ]
  );

  return {
    ...productStates,
    ...loadingStates,
    isLoading: isLoading && initialProducts.length === 0,
    isError: isError || !!initialError,
    error: error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    hasActiveFilters,
    updateFilter,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
    onDeleteProduct,
    onAddToCart,
    onViewDetails,
    onResetFilters: clearFilters,
    ...(mode === "user" && { isAddingToCart }),
  };
};
