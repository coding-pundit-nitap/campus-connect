import React, { Suspense } from "react";

import { SearchBar } from "./search-bar";

interface SearchBarContainerProps {
  className?: string;
  placeholder?: string;
}

export function SearchBarContainer({
  className,
  placeholder,
}: SearchBarContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
      }
    >
      <SearchBar className={className} placeholder={placeholder} />
    </Suspense>
  );
}

export default SearchBarContainer;
