"use client";

import { useCallback, useState } from "react";

import { useProductBrandSearch } from "../queries";

export function useBrandSearch() {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: brands = [], isLoading } =
    useProductBrandSearch(debouncedQuery);

  const handleSearchQuery = useCallback((query: string) => {
    setDebouncedQuery(query);
  }, []);

  const suggestions = brands.map((brand) => ({
    id: brand.id,
    title: brand.title,
    subtitle: brand.subtitle,
  }));

  return {
    suggestions,
    isLoadingSuggestions: isLoading,
    onSearchQuery: handleSearchQuery,
  };
}
