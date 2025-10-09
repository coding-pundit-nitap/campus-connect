import React from "react";

import { SearchBarWrapper } from "./search-bar-wrapper";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({
  className,
  placeholder = "Search products, shops",
}: SearchBarProps) {
  return <SearchBarWrapper className={className} placeholder={placeholder} />;
}
