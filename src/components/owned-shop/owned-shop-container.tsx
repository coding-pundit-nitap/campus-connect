"use client";

import React from "react";

import {
  NoMatchFilter,
  ProductFiltersContainer,
} from "@/components/shared/shared-product-filters";
import { useSharedInfiniteProducts } from "@/hooks/useSharedInfiniteProducts";
import { ProductDataDetails, SerializedProduct } from "@/types/product.types";

import { ProductListContainer } from "./product-list";
import { ShopEmptyState } from "./shop-states/shop-empty-state";
import { ShopWrapper } from "./shop-states/shop-wrapper";

type Props = {
  shop_id: string;
  initialProducts: SerializedProduct[];
  initialProductStates: ProductDataDetails;
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
};

export function OwnedShopContainer({
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
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    hasActiveFilters,
    onDeleteProduct,
    onResetFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
    showNoMatchMessage,
    isEmptyState,
  } = useSharedInfiniteProducts({
    shop_id,
    mode: "owner",
    initialProducts,
    initialProductStates,
    initialHasNextPage,
    initialNextCursor,
    initialError,
  });

  if (isEmptyState) {
    return <ShopEmptyState />;
  }

  return (
    <ShopWrapper>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 space-y-4 pb-4">
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
          <ProductListContainer
            onDeleteProduct={onDeleteProduct || (() => Promise.resolve())}
            shopData={{
              displayProducts,
              error,
              hasActiveFilters,
              isInitialLoading: isLoading && initialProducts.length === 0,
              hasError: isError && !!error,
              isLoading,
              isError,
              hasNextPage,
              isFetchingNextPage,
              fetchNextPage,
            }}
          />

          {showNoMatchMessage && (
            <NoMatchFilter onClearFilters={onResetFilters} />
          )}
        </div>
      </div>
    </ShopWrapper>
  );
}
