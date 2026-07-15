import { Loader2, Package } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function ShopListEmpty() {
  return (
    <EmptyState
      icon={<Package className="h-12 w-12 text-muted-foreground" />}
      title="No shops found"
      description="Start adding shops to your shop to see them here."
    />
  );
}

interface ShopListErrorProps {
  error: Error;
  onRetry: () => void;
}

export function ShopListError({ error, onRetry }: ShopListErrorProps) {
  return (
    <EmptyState
      icon={<div className="text-4xl">⚠️</div>}
      title="Failed to load shops"
      description={error.message}
      action={
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      }
    />
  );
}

interface ShopListFooterProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function ShopListFooter({
  hasNextPage,
  isFetchingNextPage,
}: ShopListFooterProps) {
  if (isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading more shops...</span>
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
