import React, { Suspense } from "react";

import { SearchBarServer } from "./search-bar-server";

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
      <SearchBarServer className={className} placeholder={placeholder} />
    </Suspense>
  );
}

export default SearchBarContainer;
