"use client";

import React from "react";

import {
  NoMatchFilter,
  ProductFiltersContainer,
} from "@/components/shared/shared-product-filters";
import { useShopByUser } from "@/hooks";
import { useSharedInfiniteProducts } from "@/hooks/useSharedInfiniteProducts";
import { ProductDataDetails, SerializedProduct } from "@/types/product.types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import ShopAction from "./owned-individual-shop/shop-action";
import { ShopHeaderCard } from "./owned-individual-shop/shop-header-card";
import { ProductListContainer } from "./product-list";
import { ShopEmptyState } from "./shop-states/shop-empty-state";

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
    return (
      <div className="space-y-4">
        <ShopEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>
              View, filter, and manage your products.
            </CardDescription>
          </div>
          <ShopAction />
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
