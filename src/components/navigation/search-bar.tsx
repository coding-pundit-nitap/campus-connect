"use client";
import { debounce } from "lodash";
import React, { useEffect, useMemo } from "react";

import { SharedCommand } from "@/components/shared/shared-command";
import { SharedSearchInput } from "@/components/shared/shared-search-input";
import { useSearch } from "@/hooks/useSearch";
/**
 * Props interface for the SearchBar component.
 *
 * @interface SearchBarProps
 */
interface SearchBarProps {
  /** Additional CSS classes to apply to the search container */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
}

/**
 * A search bar component with popover-based command suggestions.
 *
 * This component provides a comprehensive search interface with a popover
 * that displays search suggestions. It handles focus events, query changes,
 * and item selection with proper keyboard accessibility through the underlying
 * command component.
 * @param className - Additional CSS classes to apply to the search container
 * @param placeholder - Placeholder text for the search input
 * @returns A search bar component with command suggestions
 */
export default function SearchBar({
  className = "relative flex-1 max-w-xs sm:max-w-md",
  placeholder = "Search products, shops@/components.",
}: SearchBarProps) {
  const suggestions: { id: string; title: string; subtitle: string }[] = [];

  const onSearch = useMemo(
    () =>
      debounce((_query: string) => {
        // TODO: search on each Query.
      }, 500),
    []
  );

  const onSelectItem = useMemo(
    () => (_value: string) => {
      // TODO: On Select Suggestion.
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
    <div className="relative">
      <SharedSearchInput
        className={className}
        placeholder={placeholder}
        onChange={handleInputChange}
        value={searchTerm}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onClick={handleInputClick}
        showIcon
      />
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-2 sm:mx-0 sm:left-0 sm:right-auto sm:w-full sm:min-w-[300px] sm:max-w-[400px] md:w-[400px] z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md max-h-[300px] overflow-y-auto">
          <SharedCommand
            commandSuggestions={suggestions}
            onSelectItem={handleSelectItem}
            query={searchTerm}
            showInput={false}
          />
        </div>
      )}
    </div>
  );
}
