import React from "react";

import { StateDisplay } from "@/components/shared/shared-states";

export function ProductListEmpty() {
  return (
    <StateDisplay
      icon="📦"
      title="No products found"
      description="Start adding products to your shop to see them here."
    />
  );
}
