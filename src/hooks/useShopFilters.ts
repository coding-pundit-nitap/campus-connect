import { useCallback, useMemo, useState } from "react";

import {
  createDefaultFilterState,
  FilterState,
  productUIServices,
} from "@/lib/utils-functions";
import { SerializedProduct } from "@/types/product.types";

export const useProductFilters = (products: SerializedProduct[]) => {
  const [filters, setFilters] = useState<FilterState>(
    createDefaultFilterState()
  );

  const filteredProducts = useMemo(() => {
    return productUIServices.applyAllFilters(products, filters);
  }, [products, filters]);

  const hasActiveFilters = useMemo(() => {
    return productUIServices.hasActiveFilters(filters);
  }, [filters]);

  const updateFilter = useCallback((update: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultFilterState());
  }, []);

  const filterUpdaters = useMemo(
    () => productUIServices.createFilterUpdaters(updateFilter),
    [updateFilter]
  );

  return {
    filters,
    filteredProducts,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    ...filterUpdaters,
  };
};
