import { SearchX } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface NoMatchFilterProps {
  onClearFilters: () => void;
}

export function NoMatchFilter({ onClearFilters }: NoMatchFilterProps) {
  return (
    <EmptyState
      icon={<SearchX className="h-12 w-12 text-muted-foreground" />}
      title="No products match your filters"
      description="Try adjusting your search criteria or clear filters to see all products."
      action={
        <Button onClick={onClearFilters} variant="outline">
          Clear all filters
        </Button>
      }
    />
  );
}
