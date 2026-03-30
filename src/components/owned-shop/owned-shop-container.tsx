"use client";

import React from "react";

import {
  NoMatchFilter,
  ProductFiltersContainer,
} from "@/components/shared/product-filters";
import { Card, CardContent } from "@/components/ui/card";
import { useSharedInfiniteProducts } from "@/hooks";
import { ProductDataDetails, SerializedProduct } from "@/types/product.types";

import { ProductListContainer } from "./product-list";
import { ShopAction } from "./shop-header/shop-action";

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
  } = useSharedInfiniteProducts({
    shop_id,
    mode: "owner",
    initialProducts,
    initialProductStates,
    initialHasNextPage,
    initialNextCursor,
    initialError,
  });

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      {/* Page Header (Flattened) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Product Management
          </h1>
          <p className="text-muted-foreground">
            View, filter, and manage your products.
          </p>
        </div>
        <ShopAction />
      </div>

      {/* Filter Panel (Isolated) */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      <div className="space-y-4">
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
          <div className="pt-8">
            <NoMatchFilter onClearFilters={onResetFilters} />
          </div>
        )}
      </div>
    </div>
  );
}
