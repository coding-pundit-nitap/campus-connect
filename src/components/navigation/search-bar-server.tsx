import React from "react";

import { SearchBarWrapper } from "./search-bar-wrapper";

interface SearchBarServerProps {
  className?: string;
  placeholder?: string;
}

export function SearchBarServer({
  className,
  placeholder = "Search products, shops",
}: SearchBarServerProps) {
  return <SearchBarWrapper className={className} placeholder={placeholder} />;
}
