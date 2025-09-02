import React from "react";

import { StateDisplay } from "@/components/shared/shared-states";

interface ProductListErrorProps {
  error: Error;
  onRetry: () => void;
}

export function ShopListError({ error, onRetry }: ProductListErrorProps) {
  return (
    <StateDisplay
      icon="⚠️"
      title="Failed to load shops"
      description={error.message}
      action={{
        label: "Try Again",
        onClick: onRetry,
        variant: "outline",
      }}
    />
  );
}
