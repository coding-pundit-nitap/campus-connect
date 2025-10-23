"use client";
import { useRouter } from "next/navigation";
import React from "react";

import { useNavigationSearch, useSearch, useSearchQuery } from "@/hooks";
import {
  createSearchNavigationHandler,
  mapSearchResultsToSuggestions,
} from "@/lib/utils-functions/order.utils";

import { SharedSearchBar } from "../shared/shared-search-bar";

interface SearchBarClientWrapperProps {
  className?: string;
  placeholder?: string;
}

export function SearchBarWrapper({
  className,
  placeholder,
}: SearchBarClientWrapperProps) {
  const router = useRouter();

  const handleNavigation = createSearchNavigationHandler({
    onNavigateToShop: (shopId: string) => {
      router.push(`/shops/${shopId}`);
    },
    onNavigateToProduct: (productId: string, shopId?: string) => {
      if (shopId) {
        router.push(`/product/${productId}`);
      }
    },
  });

  const { debouncedQuery, onSearch, onSelectItem } = useNavigationSearch({
    onNavigate: handleNavigation,
  });

  const { data: searchResults = [], isLoading } =
    useSearchQuery(debouncedQuery);

  const suggestions = mapSearchResultsToSuggestions(searchResults);

  const handleSelectItem = (value: string) => {
    onSelectItem(value, searchResults);
  };

  const baseSearch = useSearch({
    onSearch,
    onSelectItem: handleSelectItem,
    suggestions,
  });

  return (
    <SharedSearchBar
      className={className}
      placeholder={placeholder}
      value={baseSearch.inputValue}
      onChange={baseSearch.handleInputChange}
      onFocus={baseSearch.handleInputFocus}
      onBlur={baseSearch.handleInputBlur}
      onClick={baseSearch.handleInputClick}
      onSelectItem={baseSearch.handleSelectItem}
      suggestions={suggestions}
      showSuggestionsDropdown={
        baseSearch.showSuggestionsDropdown &&
        (isLoading || suggestions.length > 0)
      }
      isLoading={isLoading}
    />
  );
}
