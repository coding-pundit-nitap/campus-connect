"use client";
import React from "react";

import { SharedCommand } from "@/components/shared/shared-command";
import { SharedSearchInput } from "@/components/shared/shared-search-input";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSelectItem: (value: string) => void;
  suggestions: Array<{ id: string; title: string; subtitle: string }>;
  isSearching: boolean;
}

export function SearchBar({
  className = "relative flex-1 max-w-xs sm:max-w-md",
  placeholder = "Search products, shops",
  value,
  onChange,
  onFocus,
  onBlur,
  onClick,
  onSelectItem,
  suggestions,
  isSearching,
}: SearchBarProps) {
  return (
    <div className="relative">
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
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-2 sm:mx-0 sm:left-0 sm:right-auto sm:w-full sm:min-w-[300px] sm:max-w-[400px] md:w-[400px] z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md max-h-[300px] overflow-y-auto">
          <SharedCommand
            commandSuggestions={suggestions}
            onSelectItem={onSelectItem}
            query={value}
            showInput={false}
          />
        </div>
      )}
    </div>
  );
}
