"use client";
import React from "react";

import { SharedCommand } from "@/components/shared/shared-command";
import { SharedSearchInput } from "@/components/shared/shared-search-input";

export interface SharedSearchBarProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSelectItem: (value: string) => void;
  suggestions: { id: string; title: string; subtitle: string }[];
  showSuggestionsDropdown: boolean;
  isLoading?: boolean;
  onInputChange?: (value: string) => void;
}

export function SharedSearchBar({
  className = "relative flex-1 max-w-xs sm:max-w-md",
  placeholder = "Search products, shops",
  value,
  onChange,
  onFocus,
  onBlur,
  onClick,
  onSelectItem,
  suggestions,
  showSuggestionsDropdown,
  isLoading = false,
  onInputChange,
}: SharedSearchBarProps) {
  return (
    <div className="relative m-0 flex items-center justify-center">
      <SharedSearchInput
        className={className}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        showIcon
      />
      {showSuggestionsDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-2 sm:mx-0 sm:left-0 sm:right-auto sm:w-full sm:min-w-[300px] sm:max-w-[400px] md:w-[400px] z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md max-h-[300px] overflow-y-auto">
          <SharedCommand
            commandSuggestions={suggestions}
            onSelectItem={onSelectItem}
            onInputChange={onInputChange}
            query={value}
            showInput={false}
            isLoading={isLoading}
            emptyMessage={isLoading ? "Searching..." : "No results found"}
          />
        </div>
      )}
    </div>
  );
}
