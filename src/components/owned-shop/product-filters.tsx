import React from "react";

import { useOwnerProducts } from "@/hooks/useOwnerProducts";
import { productUIServices } from "@/lib/utils-functions";

import { ProductFilters } from "./product-filters/product-filters";

interface ProductFiltersProps {
  shop_id: string;
}

export function ProductFiltersContainer({ shop_id }: ProductFiltersProps) {
  const {
    filters,
    hasActiveFilters,
    clearFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useOwnerProducts(shop_id);

  const sortOptions = productUIServices.getSortOptions();

  const handleSortChange = (value: string) => {
    const { sortBy, sortOrder } =
      productUIServices.parseSortValueToOptions(value);
    updateSort(sortBy, sortOrder);
  };

  const handlePriceRangeChange = (min: number | null, max: number | null) => {
    const priceRange = productUIServices.handlePriceRangeChange(min, max);
    updatePriceRange(priceRange.min, priceRange.max);
  };

  const activeFilters = productUIServices.createActiveFilters(
    filters,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter
  );

  return (
    <ProductFilters
      filters={filters}
      hasActiveFilters={hasActiveFilters}
      sortOptions={sortOptions}
      activeFilters={activeFilters}
      onSearchChange={updateSearch}
      onPriceRangeChange={handlePriceRangeChange}
      onStockFilterClick={updateStockFilter}
      onSortChange={handleSortChange}
      onClearFilters={clearFilters}
    />
  );
}
