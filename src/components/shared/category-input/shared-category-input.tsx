"use client";

import React from "react";

import { useSearchInput } from "@/hooks/useSearch";

import { SharedSearchBar } from "../shared-search-bar";

export interface CategoryInputProps {
  /** Current selected category value */
  value: string;
  /** Callback when category is selected or created */
  onChange: (category: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Error state */
  error?: boolean;
  /** Custom suggestions data - makes component reusable */
  suggestions?: Array<{ id: string; title: string; subtitle: string }>;
  /** Loading state for suggestions */
  isLoadingSuggestions?: boolean;
  /** Custom search function for external data fetching */
  onSearchQuery?: (query: string) => void;
}

export function SharedCategoryInput({
  value,
  onChange,
  placeholder = "Select or create category...",
  className,
  suggestions = [],
  isLoadingSuggestions = false,
  onSearchQuery,
}: CategoryInputProps) {
  const {
    showSuggestionsDropdown,
    inputValue,
    handleInputBlur,
    handleInputClick,
    handleSelectItem,
    handleInputFocus,
    handleInputChange,
  } = useSearchInput({
    value,
    onChange,
    suggestions,
    isLoadingSuggestions,
    onSearchQuery,
  });

  return (
    <SharedSearchBar
      className={className}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      onClick={handleInputClick}
      onSelectItem={handleSelectItem}
      suggestions={suggestions}
      showSuggestionsDropdown={
        showSuggestionsDropdown &&
        (isLoadingSuggestions || suggestions.length > 0)
      }
      isLoading={isLoadingSuggestions}
    />
  );
}
