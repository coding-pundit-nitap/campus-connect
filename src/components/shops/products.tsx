"use client";
import React from "react";

import { NoMatchFilter } from "@/components/shared/shared-product-filters";
import { ProductFiltersContainer } from "@/components/shared/shared-product-filters/";
import { useIndividualShop } from "@/hooks/useIndividualShop";

import IndividualProductList from "./shop-product-list";

interface ProductListProps {
  error?: Error | null;
  shop_id: string;
}

export function ProductListContainer({ shop_id }: ProductListProps) {
  const shopData = useIndividualShop(shop_id);
  const {
    showNoMatchMessage,
    onResetFilters,
    filters,
    hasActiveFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = shopData;

  return (
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
        <IndividualProductList shop_id={shop_id} shopData={shopData} />
        {showNoMatchMessage && (
          <NoMatchFilter onClearFilters={onResetFilters} />
        )}
      </div>
    </div>
  );
}
