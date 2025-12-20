import { Package } from "lucide-react";
import React from "react";

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
