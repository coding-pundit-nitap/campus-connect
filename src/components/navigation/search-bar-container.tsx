"use client";
import { debounce } from "lodash";
import React, { useEffect, useMemo } from "react";

import { useSearch } from "@/hooks/useSearch";

import { SearchBar } from "./search-bar";

interface SearchBarContainerProps {
  className?: string;
  placeholder?: string;
}

export function SearchBarContainer({
  className,
  placeholder,
}: SearchBarContainerProps) {
  const suggestions: { id: string; title: string; subtitle: string }[] = [];

  const onSearch = useMemo(
    () =>
      debounce((_query: string) => {
        // TODO: Implement actual search logic
      }, 500),
    []
  );

  const onSelectItem = useMemo(
    () => (_value: string) => {
      // TODO: Handle item selection
    },
    []
  );

  const {
    isSearching,
    searchTerm,
    handleInputBlur,
    handleInputClick,
    handleSelectItem,
    handleInputFocus,
    handleInputChange,
  } = useSearch({ onSearch, onSelectItem, suggestions });

  useEffect(() => {
    return () => {
      onSearch.cancel();
    };
  }, [onSearch]);

  return (
    <SearchBar
      className={className}
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      onClick={handleInputClick}
      onSelectItem={handleSelectItem}
      suggestions={suggestions}
      isSearching={isSearching}
    />
  );
}

export default SearchBarContainer;
