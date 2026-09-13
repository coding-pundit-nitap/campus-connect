import React from "react";

import { CardSkeleton } from "@/components/shared/shared-skeleton";

interface ProductSkeletonGridProps {
  count?: number;
  renderSkeletonCard?: () => React.ReactNode;
}

export function ProductSkeletonGrid({
  count = 6,
  renderSkeletonCard,
}: ProductSkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) =>
        renderSkeletonCard ? (
          <React.Fragment key={index}>{renderSkeletonCard()}</React.Fragment>
        ) : (
          <CardSkeleton key={index} />
        )
      )}
    </div>
  );
}
