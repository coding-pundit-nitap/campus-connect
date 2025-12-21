import React from "react";

import {
  ActiveFilters,
  FilterControls,
} from "@/components/shared/shared-filters";
import { Card, CardContent } from "@/components/ui/card";

interface ProductFiltersProps {
  filters: {
    search: string;
    priceRange: { min: number; max: number };
    inStock: boolean | null;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  hasActiveFilters: boolean;
  sortOptions: { value: string; label: string }[];
  activeFilters: {
    label: string;
    value: string;
    onRemove: () => void;
  }[];
  onSearchChange: (value: string) => void;
  onPriceRangeChange: (min: number | null, max: number | null) => void;
  onStockFilterClick: (stockFilter: boolean | null) => void;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  filters,
  hasActiveFilters,
  sortOptions,
  activeFilters,
  onSearchChange,
  onPriceRangeChange,
  onStockFilterClick,
  onSortChange,
  onClearFilters,
}: ProductFiltersProps) {
  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-4">
        <FilterControls
          className="flex flex-col md:flex-row gap-4 md:items-center"
          searchValue={filters.search}
          searchPlaceholder="Search products..."
          onSearchChange={onSearchChange}
          onPriceRangeChange={onPriceRangeChange}
          toggleButtons={[
            {
              label: "Stock",
              options: [
                { value: true, label: "In Stock" },
                { value: false, label: "Out of Stock" },
              ],
              selectedValue: filters.inStock,
              onToggle: onStockFilterClick,
            },
          ]}
          selectOptions={[
            {
              label: "Sort by",
              placeholder: "Select sorting option",
              options: sortOptions,
              value: `${filters.sortBy}-${filters.sortOrder}`,
              onValueChange: onSortChange,
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
        />

        <ActiveFilters filters={activeFilters} className="mt-4" />
      </CardContent>
    </Card>
  );
}
