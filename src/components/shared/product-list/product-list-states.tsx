import { Loader2, Package } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function ProductListEmpty() {
  return (
    <EmptyState
      icon={<Package className="h-12 w-12 text-muted-foreground" />}
      title="No products found"
      description="Start adding products to your shop to see them here."
    />
  );
}

interface ProductListErrorProps {
  error: Error;
  onRetry: () => void;
}

export function ProductListError({ error, onRetry }: ProductListErrorProps) {
  return (
    <EmptyState
      icon={<div className="text-4xl">⚠️</div>}
      title="Failed to load products"
      description={error.message}
      action={
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      }
    />
  );
}

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
          <Loader2 className="h-4 w-4 animate-spin" />
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
