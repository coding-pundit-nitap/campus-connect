import { Search, X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Props interface for the SharedSearchInput component.
 *
 * @interface SharedSearchInputProps
 */
export interface SharedSearchInputProps {
  /** Additional CSS classes to apply to the search container */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Current search value */
  value: string;
  /** Change handler for input value */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Click handler for container */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Key down handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Clear handler */
  onClear?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Show search icon */
  showIcon?: boolean;
  /** Show clear button when there's text */
  showClear?: boolean;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Input size variant */
  size?: "sm" | "default" | "lg";
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Input type */
  type?: "text" | "search";
}

export function SharedSearchInput({
  className = "relative flex-1 max-w-md",
  placeholder = "Search...",
  value,
  onChange,
  onFocus,
  onBlur,
  onClick,
  onKeyDown,
  onClear,
  disabled = false,
  isLoading = false,
  showIcon = true,
  showClear = true,
  icon: IconComponent = Search,
  size = "default",
  autoFocus = false,
  type = "text",
}: SharedSearchInputProps) {
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      const input = e.currentTarget.querySelector("input");
      input?.focus();
    }
    onClick?.(e);
  };

  const handleClear = () => {
    const syntheticEvent = {
      target: { value: "" },
      currentTarget: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
    onClear?.();
  };

  const sizeClasses = {
    sm: "h-8",
    default: "h-9",
    lg: "h-10",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };
  return (
    <div className={`${className} relative`} onClick={handleContainerClick}>
      {showIcon && (
        <IconComponent
          className={`absolute left-3 top-1/2 ${iconSizeClasses[size]} transform -translate-y-1/2 text-muted-foreground pointer-events-none`}
          aria-hidden="true"
        />
      )}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        disabled={disabled || isLoading}
        autoFocus={autoFocus}
        className={`
          ${showIcon ? "pl-10" : "pl-3"} 
          ${(showClear && value) || isLoading ? "pr-10" : "pr-3"}
          ${sizeClasses[size]} 
          truncate
        `}
        aria-label="Search"
        autoComplete="off"
        role="searchbox"
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {isLoading ? (
          <div
            className={`${iconSizeClasses[size]} animate-spin rounded-full border-2 border-muted-foreground border-t-transparent`}
          />
        ) : (
          showClear &&
          value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              className={`${iconSizeClasses[size]} items-center p-0 hover:bg-transparent`}
              aria-label="Clear search"
            >
              <X className={iconSizeClasses[size]} />
            </Button>
          )
        )}
      </div>
    </div>
  );
}
