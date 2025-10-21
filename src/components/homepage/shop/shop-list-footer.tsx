import React from "react";

import LoadingSpinner from "@/components/shared/shared-loading-spinner"; // Assuming a shared spinner

type Props = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export default function ShopListFooter({
  hasNextPage,
  isFetchingNextPage,
}: Props) {
  if (isFetchingNextPage) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner />
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
