import React, { HTMLInputTypeAttribute } from "react";
import { FieldValues, Path } from "react-hook-form";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface CardConfig {
  title?: string;
  description?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
}

export interface FormFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: HTMLInputTypeAttribute | "file" | "textarea" | "search" | "category";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
  customProps?: Record<string, unknown>;
  // Category/suggestion-related properties
  suggestions?: Array<{ id: string; title: string; subtitle: string }>;
  isLoadingSuggestions?: boolean;
  onSearchQuery?: (query: string) => void;
}

export interface ButtonConfig {
  text: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface CartConfig {
  showBadge?: boolean;
  currency?: string;
  showItemCount?: boolean;
  emptyMessage?: string;
}

export interface AuthProviderConfig {
  provider: "google" | "facebook" | "github";
  iconSrc: string;
  label: string;
  onClick: () => void;
}
