import React from "react";

import { ProductFilters } from "@/components/shared/product-filters";
import { productUIServices } from "@/lib/utils";
import { FilterState } from "@/lib/utils/product.utils";

interface ProductFiltersProps {
  filters: FilterState;
  hasActiveFilters: boolean;
  updateSearch: (search: string) => void;
  updatePriceRange: (min: number, max: number) => void;
  updateStockFilter: (inStock: boolean | null) => void;
  updateSort: (
    sortBy: FilterState["sortBy"],
    sortOrder: FilterState["sortOrder"]
  ) => void;
  clearFilters: () => void;
  clearSearchFilter: () => void;
  clearPriceFilter: () => void;
  clearStockFilter: () => void;
}

export function ProductFiltersContainer({
  filters,
  hasActiveFilters,
  updateSearch,
  updatePriceRange,
  updateStockFilter,
  updateSort,
  clearFilters,
  clearSearchFilter,
  clearPriceFilter,
  clearStockFilter,
}: ProductFiltersProps) {
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
