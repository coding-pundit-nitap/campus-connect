import React from "react";

import { SharedSearchBar } from "@/components/shared/shared-search-bar";

interface SearchBarProps {
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
}

export function SearchBar(props: SearchBarProps) {
  return <SharedSearchBar {...props} />;
}
