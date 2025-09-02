import React from "react";

import { Button } from "@/components/ui/button";

interface NoMatchFilterProps {
  onClearFilters: () => void;
}

export function NoMatchFilter({ onClearFilters }: NoMatchFilterProps) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold mb-2">
        No products match your filters
      </h3>
      <p className="text-muted-foreground mb-4">
        Try adjusting your search criteria or clear filters to see all products.
      </p>
      <Button onClick={onClearFilters} className="text-primary hover:underline">
        Clear all filters
      </Button>
    </div>
  );
}
