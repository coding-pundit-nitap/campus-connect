"use client";

import React from "react";

import { NoMatchFilter } from "@/components/shared/product-filters";
import { ProductFiltersContainer } from "@/components/shared/product-filters/";
import { useSharedInfiniteProducts } from "@/hooks/queries/useSharedInfiniteProducts";
import { ProductDataDetails, SerializedProduct } from "@/types/product.types";

import { BatchCountdownBanner } from "./batch";
import { ShopProductList } from "./shop-product-list";

type Props = {
  shop_id: string;
  initialProducts: SerializedProduct[];
  initialProductStates: ProductDataDetails;
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
};

export function ProductsContainer({
  shop_id,
  initialProducts,
  initialProductStates,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
  initialError,
}: Props) {
  const {
    displayProducts,
    isLoading,
    fetchNextPage,
    error,
    hasActiveFilters,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isInitialLoading,
    hasError,
    onAddToCart,
    onViewDetails,
    isAddingToCart,
    showNoMatchMessage,
    onResetFilters,
    filters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useSharedInfiniteProducts({
    shop_id,
    mode: "user",
    initialProducts,
    initialProductStates,
    initialHasNextPage,
    initialNextCursor,
    initialError,
  });

  return (
    <div className="flex flex-col h-full">
      <BatchCountdownBanner shopId={shop_id} />
      <div className="shrink-0 space-y-4 pb-4">
        <ProductFiltersContainer
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          updateSearch={updateSearch}
          updatePriceRange={updatePriceRange}
          updateStockFilter={updateStockFilter}
          updateSort={updateSort}
          clearFilters={onResetFilters}
          clearSearchFilter={clearSearchFilter}
          clearPriceFilter={clearPriceFilter}
          clearStockFilter={clearStockFilter}
        />
      </div>
      <div className="flex-1 hide-scrollbar overflow-y-auto">
        <ShopProductList
          displayProducts={displayProducts}
          isLoading={isLoading}
          fetchNextPage={fetchNextPage}
          error={error}
          hasActiveFilters={hasActiveFilters}
          hasNextPage={hasNextPage}
          isError={isError}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          hasError={hasError}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
          isAddingToCart={isAddingToCart}
        />
        {showNoMatchMessage && (
          <NoMatchFilter onClearFilters={onResetFilters} />
        )}
      </div>
    </div>
  );
}
