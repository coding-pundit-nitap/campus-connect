import React from "react";

import { Button } from "@/components/ui/button";

interface ProductListFooterProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  displayProductsLength: number;
  onFetchNextPage: () => void;
}

export function ProductListFooter({
  hasNextPage,
  isFetchingNextPage,
  displayProductsLength,
  onFetchNextPage,
}: ProductListFooterProps) {
  if (isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-muted-foreground">
            Loading more products...
          </span>
        </div>
      </div>
    );
  }

  if (hasNextPage && !isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <Button
          onClick={onFetchNextPage}
          variant="outline"
          size="lg"
          className="px-8"
        >
          Load More Products
        </Button>
      </div>
    );
  }

  if (!hasNextPage && displayProductsLength > 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You&apos;ve reached the end of the product list
        </p>
      </div>
    );
  }

  return null;
}
