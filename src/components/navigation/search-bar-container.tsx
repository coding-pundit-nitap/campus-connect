"use client";
import { useRouter } from "next/navigation";
import React from "react";

import { useSearchQuery, useNavigationSearch, useSearch } from "@/hooks";

import { SharedSearchBar } from "../shared/shared-search-bar";

interface SearchBarContainerProps {
  className?: string;
  placeholder?: string;
}

export function SearchBarContainer({
  className,
  placeholder,
}: SearchBarContainerProps) {
  const router = useRouter();

  const handleNavigation = (selectedItem: any) => {
    if (selectedItem.type === "shop") {
      router.push(`/shops/${selectedItem.id}`);
    } else if (selectedItem.type === "product") {
      if (selectedItem.shop_id) {
        router.push(`/shops/${selectedItem.shop_id}`);
      }
    }
  };

  const { debouncedQuery, onSearch, onSelectItem } = useNavigationSearch({
    onNavigate: handleNavigation,
  });

  const { data: searchResults = [], isLoading } = useSearchQuery(debouncedQuery);

  const suggestions = searchResults.map((result) => ({
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
  }));

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
      showSuggestionsDropdown={baseSearch.showSuggestionsDropdown && (isLoading || suggestions.length > 0)}
      isLoading={isLoading}
    />
  );
}

export default SearchBarContainer;
