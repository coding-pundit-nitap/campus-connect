import React from "react";

import { Button } from "@/components/ui/button";

type Props = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  displayShopsLength: number;
  onFetchNextPage: () => void;
};

export default function ShopListFooter({
  hasNextPage,
  isFetchingNextPage,
  displayShopsLength,
  onFetchNextPage,
}: Props) {
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

  if (!hasNextPage && displayShopsLength > 0) {
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
