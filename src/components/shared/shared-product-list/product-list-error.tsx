import React from "react";

import { StateDisplay } from "@/components/shared/shared-states";

interface ProductListErrorProps {
  error: Error;
  onRetry: () => void;
}

export function ProductListError({ error, onRetry }: ProductListErrorProps) {
  return (
    <StateDisplay
      icon="⚠️"
      title="Failed to load products"
      description={error.message}
      action={{
        label: "Try Again",
        onClick: onRetry,
        variant: "outline",
      }}
    />
  );
}
