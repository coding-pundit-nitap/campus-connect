import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { SharedFilterProductSearch } from "./shared-filter-product-search";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterControlsProps {
  className?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  showPriceRange?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  onPriceRangeChange?: (min: number | null, max: number | null) => void;

  toggleButtons?: {
    label: string;
    options: { value: boolean | null; label: string }[];
    selectedValue: boolean | null;
    onToggle: (value: boolean | null) => void;
  }[];

  selectOptions?: {
    label: string;
    placeholder: string;
    options: FilterOption[];
    value: string;
    onValueChange: (value: string) => void;
  }[];

  // Actions
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function FilterControls({
  className,
  searchValue = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  showPriceRange = false,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  toggleButtons = [],
  selectOptions = [],
  hasActiveFilters = false,
  onClearFilters,
}: FilterControlsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {onSearchChange && (
        <div>
          <SharedFilterProductSearch
            value={searchValue}
            placeholder={searchPlaceholder}
            className="max-w-sm"
            onSearchChange={onSearchChange}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        {showPriceRange && onPriceRangeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Price:</span>
            <Input
              type="number"
              placeholder="Min"
              value={minPrice ?? ""}
              onChange={(e) =>
                onPriceRangeChange(
                  e.target.value ? Number(e.target.value) : null,
                  maxPrice ?? null
                )
              }
              className="w-20"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice ?? ""}
              onChange={(e) =>
                onPriceRangeChange(
                  minPrice ?? null,
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-20"
            />
          </div>
        )}

        {toggleButtons.map((toggle, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {toggle.label}:
            </span>
            {toggle.options.map((option) => (
              <Button
                key={String(option.value)}
                variant={
                  toggle.selectedValue === option.value ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  toggle.onToggle(
                    toggle.selectedValue === option.value ? null : option.value
                  )
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        ))}

        {selectOptions.map((select, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {select.label}:
            </span>
            <Select value={select.value} onValueChange={select.onValueChange}>
              <SelectTrigger>
                <SelectValue placeholder={select.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {hasActiveFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

interface ActiveFiltersProps {
  className?: string;
  filters: {
    label: string;
    value: string;
    onRemove: () => void;
  }[];
}

export function ActiveFilters({ className, filters }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter, index) => (
        <Badge key={index} variant="secondary" className="gap-1">
          {filter.label}: {filter.value}
          <button
            onClick={filter.onRemove}
            className="ml-1 hover:text-destructive"
          >
            x
          </button>
        </Badge>
      ))}
    </div>
  );
}
