"use client";

import { useCallback, useState } from "react";

import { useProductCategoriesSearch } from "./tanstack";

export function useCategorySearch() {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: categories = [], isLoading } =
    useProductCategoriesSearch(debouncedQuery);

  const handleSearchQuery = useCallback((query: string) => {
    setDebouncedQuery(query);
  }, []);

  const suggestions = categories.map((category) => ({
    id: category.id,
    title: category.title,
    subtitle: category.subtitle,
  }));

  return {
    suggestions,
    isLoadingSuggestions: isLoading,
    onSearchQuery: handleSearchQuery,
  };
}
