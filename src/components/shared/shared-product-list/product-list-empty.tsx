import { Package } from "lucide-react";
import React from "react";

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
