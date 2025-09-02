import React from "react";

import { ListHeader } from "@/components/shared/shared-list-header";

interface ShopProductListHeaderProps {
  countMessage?: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ShopProductListHeader({
  countMessage,
  hasActiveFilters,
  onClearFilters,
}: ShopProductListHeaderProps) {
  return (
    <ListHeader
      customCountMessage={countMessage}
      showAction={hasActiveFilters}
      actionLabel="View all products"
      onActionClick={onClearFilters}
    />
  );
}
