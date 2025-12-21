import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";

import { useNavigationSearch, useSearch, useSearchQuery } from "@/hooks";
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
    } else if (selectedItem.type === "shop") {
      router.push(`/shops/${selectedItem.id}`);
    } else if (selectedItem.type === "category") {
      if (selectedItem.shop_id) {
        router.push(
          `/shops/${selectedItem.shop_id}?category=${selectedItem.id}`
        );
      }
    }
  };

  const { debouncedQuery, onSearch, onSelectItem } = useNavigationSearch({
    onNavigate: handleNavigation,
  });

  const { data: searchResults = [], isLoading } =
    useSearchQuery(debouncedQuery);

  const suggestions = searchResults.map((result) => ({
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
    type: result.type,
  }));

  const handleSelectItem = (value: string) => {
    onSelectItem(value, searchResults);
  };

  const debouncedOnSearchChange = useMemo(
    () =>
      debounce((query: string) => {
        onSearchChange?.(query);
      }, 300),
    [onSearchChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnSearchChange.cancel();
    };
  }, [debouncedOnSearchChange]);

  const handleSearch = (query: string) => {
    onSearch(query);
    if (query.trim().length >= 2) {
      debouncedOnSearchChange(query);
    } else {
      debouncedOnSearchChange.cancel();
      onSearchChange?.("");
    }
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
