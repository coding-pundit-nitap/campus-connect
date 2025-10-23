import { useRouter } from "next/navigation";
import React from "react";

import { useNavigationSearch, useProductSearchQuery, useSearch } from "@/hooks";
import { SearchResult } from "@/types";

import { SharedSearchBar } from "./shared-search-bar";

interface SharedFilterProductSearchProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onSearchChange?: (value: string) => void;
}

export function SharedFilterProductSearch({
  className,
  placeholder,
  value,
  onSearchChange,
}: SharedFilterProductSearchProps) {
  const router = useRouter();

  const handleNavigation = (selectedItem: SearchResult) => {
    if (selectedItem.type === "product") {
      if (selectedItem.shop_id) {
        router.push(`/product/${selectedItem.id}`);
      }
    }
  };

  const { debouncedQuery, onSearch, onSelectItem } = useNavigationSearch({
    onNavigate: handleNavigation,
  });

  const { data: searchResults = [], isLoading } =
    useProductSearchQuery(debouncedQuery);

  const suggestions = searchResults.map((result) => ({
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
  }));

  const handleSelectItem = (value: string) => {
    onSelectItem(value, searchResults);
  };

  const handleSearch = (query: string) => {
    onSearch(query);
    onSearchChange?.(query);
  };

  const baseSearch = useSearch({
    onSearch: handleSearch,
    onSelectItem: handleSelectItem,
    suggestions,
    initialValue: value || "",
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
