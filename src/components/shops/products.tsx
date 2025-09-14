"use client";
import React from "react";

import { NoMatchFilter } from "@/components/shared/shared-product-filters";
import { ProductFiltersContainer } from "@/components/shared/shared-product-filters/";
import { useIndividualShop } from "@/hooks/useIndividualShop";

import IndividualProductList from "./shop-product-list";

interface ProductListProps {
  error?: Error | null;
  shop_id: string;
}

export function ProductListContainer({ shop_id }: ProductListProps) {
  const { showNoMatchMessage, onResetFilters } = useIndividualShop(shop_id);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 space-y-4 pb-4">
        <ProductFiltersContainer shop_id={shop_id} />
      </div>
      <div className="flex-1 hide-scrollbar overflow-y-auto">
        <IndividualProductList shop_id={shop_id} />
        {showNoMatchMessage && (
          <NoMatchFilter onClearFilters={onResetFilters} />
        )}
      </div>
    </div>
  );
}
