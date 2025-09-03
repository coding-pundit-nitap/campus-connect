"use client";
import React from "react";

import { ShopProductListHeader } from "@/components/owned-shop/shop-header/shop-product-list-header";
import { useIndividualShop } from "@/hooks/useIndividualShop";

import { ProductFiltersContainer } from "./product-filters";
import { NoMatchFilter } from "./product-filters/no-match-filter";

interface ProductListProps {
  error?: Error | null;
  shop_id: string;
}

export function ProductListContainer({ shop_id }: ProductListProps) {
  const {
    isInitialLoading,
    hasError,
    showFilters,
    showNoMatchMessage,
    allProducts,
    displayProducts,
    hasActiveFilters,
    onResetFilters,
    error,
  } = useIndividualShop(shop_id);
  if (isInitialLoading) {
    return <div>Loading products...</div>;
  }

  if (hasError) {
    return <div>Error loading products: {error?.message}</div>;
  }

  const countMessage = hasActiveFilters
    ? `Showing ${displayProducts.length} of ${allProducts.length} products`
    : `${allProducts.length} products`;

  return (
    <div>
      {showFilters && <ProductFiltersContainer shop_id={shop_id} />}

      {showFilters && (
        <ShopProductListHeader
          countMessage={countMessage}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onResetFilters}
        />
      )}
      <ProductListContainer shop_id={shop_id} />

      {showNoMatchMessage && <NoMatchFilter onClearFilters={onResetFilters} />}
    </div>
  );
}
