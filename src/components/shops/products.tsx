"use client";
import React from "react";

import { ShopProductListHeader } from "@/components/owned-shop/shop-header/shop-product-list-header";
import { NoMatchFilter } from "@/components/shared/shared-product-filters";
import { ProductFiltersContainer } from "@/components/shared/shared-product-filters/";
import { useIndividualShop } from "@/hooks/useIndividualShop";

import IndividualProductList from "./shop-product-list";

interface ProductListProps {
  error?: Error | null;
  shop_id: string;
}

export function ProductListContainer({ shop_id }: ProductListProps) {
  const {
    showNoMatchMessage,
    allProducts,
    displayProducts,
    hasActiveFilters,
    onResetFilters,
  } = useIndividualShop(shop_id);

  const countMessage = hasActiveFilters
    ? `Showing ${displayProducts.length} of ${allProducts.length} products`
    : `${allProducts.length} products`;

  return (
    <div className="space-y-2">
      <ProductFiltersContainer shop_id={shop_id} />
      <ShopProductListHeader
        countMessage={countMessage}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onResetFilters}
      />
      <IndividualProductList shop_id={shop_id} />
      {showNoMatchMessage && <NoMatchFilter onClearFilters={onResetFilters} />}
    </div>
  );
}
