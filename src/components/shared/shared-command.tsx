import React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Suggestion item interface.
 *
 * @interface SuggestionItem
 */
export interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
}

/**
 * Props interface for the CommandList component.
 *
 * @interface SharedCommandProps
 */
export interface SharedCommandProps {
  /** Current search query string */
  query: string;
  /** Array of suggestions to display (should be pre-filtered) */
  commandSuggestions: SuggestionItem[];
  /** Callback function when an item is selected */
  onSelectItem: (value: string) => void;
  /** Callback function when input value changes */
  onInputChange?: (value: string) => void;
  /** Placeholder text for the command input */
  placeholder?: string;
  /** Message to show when no results are found */
  emptyMessage?: string;
  /** Group heading text for suggestions */
  groupHeading?: string;
  /** Additional CSS classes for the command container */
  className?: string;
  /** Whether to show the command input */
  showInput?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Maximum height for the command list */
  maxHeight?: string;
}

export function SharedCommand({
  query = "",
  commandSuggestions = [],
  onSelectItem,
  onInputChange,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  groupHeading = "Suggestions",
  className = "rounded-lg border shadow-md w-full",
  showInput = true,
  isLoading = false,
  maxHeight = "300px",
}: SharedCommandProps) {
  const handleInputChange = (value: string) => {
    onInputChange?.(value);
  };

  const handleSelect = (item: SuggestionItem) => {
    onSelectItem(item.title);
  };

  if (isLoading) {
    return (
      <Command className={className}>
        {showInput && (
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={handleInputChange}
            disabled
          />
        )}
        <CommandList style={{ maxHeight }}>
          <CommandEmpty>Loading...</CommandEmpty>
        </CommandList>
      </Command>
    );
  }

  return (
    <Command className={className} shouldFilter={false}>
      {showInput && (
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={handleInputChange}
        />
      )}
      <CommandList style={{ maxHeight }}>
        {commandSuggestions.length === 0 ? (
          <CommandEmpty>{emptyMessage}</CommandEmpty>
        ) : (
          <CommandGroup heading={groupHeading}>
            {commandSuggestions.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(item)}
                onMouseDown={(e) => e.preventDefault()}
                className="p-3 sm:p-2 cursor-pointer"
                value={item.id}
              >
                <div className="flex flex-col w-full">
                  <span className="text-sm sm:text-base font-medium">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
