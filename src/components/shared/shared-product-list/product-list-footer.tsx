import React from "react";

import LoadingSpinner from "../shared-loading-spinner";

interface ProductListFooterProps {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

export function ProductListFooter({
  hasNextPage,
  isFetchingNextPage,
}: ProductListFooterProps) {
  if (isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner />
          <span>Loading more...</span>
        </div>
      </div>
    );
  }

  if (!hasNextPage) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">You've reached the end ✨</p>
      </div>
    );
  }

  return null;
}
