import React from "react";

import {
  NoMatchFilter,
  ProductFiltersContainer,
} from "@/components/shared/shared-product-filters";
import { useOwnedShop } from "@/hooks/useOwnedShop";

import { ProductListContainer } from "./product-list";
import { ShopProductListHeader } from "./shop-header/shop-product-list-header";
import { ShopEmptyState } from "./shop-states/shop-empty-state";
import { ShopWrapper } from "./shop-states/shop-wrapper";

interface OwnedShopProps {
  shop_id: string;
}

export function OwnedShop({ shop_id }: OwnedShopProps) {
  const {
    isEmptyState,
    showNoMatchMessage,
    onDeleteProduct,
    allProducts,
    displayProducts,
    hasActiveFilters,
    onResetFilters,
  } = useOwnedShop(shop_id);

  if (isEmptyState) {
    return <ShopEmptyState />;
  }

  const countMessage = hasActiveFilters
    ? `Showing ${displayProducts.length} of ${allProducts.length} products`
    : `${allProducts.length} products`;

  return (
    <ShopWrapper>
      <div className="space-y-6">
        <ProductFiltersContainer shop_id={shop_id} />
        <ShopProductListHeader
          countMessage={countMessage}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onResetFilters}
        />
        <ProductListContainer
          onDeleteProduct={onDeleteProduct}
          shop_id={shop_id}
        />

        {showNoMatchMessage && (
          <NoMatchFilter onClearFilters={onResetFilters} />
        )}
      </div>
    </ShopWrapper>
  );
}

export default OwnedShop;
