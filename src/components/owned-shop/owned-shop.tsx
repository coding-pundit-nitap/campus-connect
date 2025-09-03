import React from "react";

import { ProductFiltersContainer } from "@/components/shops/products/product-filters";
import { useOwnedShop } from "@/hooks/useOwnedShop";

import { NoMatchFilter } from "./product-filters/no-match-filter";
import { ProductListContainer } from "./product-list";
import { ShopProductListHeader } from "./shop-header/shop-product-list-header";
import { ShopEmptyState } from "./shop-states/shop-empty-state";
import { ShopErrorState } from "./shop-states/shop-error-state";
import { ShopLoadingState } from "./shop-states/shop-loading-state";
import { ShopWrapper } from "./shop-states/shop-wrapper";

interface OwnedShopProps {
  shop_id: string;
}

export function OwnedShop({ shop_id }: OwnedShopProps) {
  const {
    isInitialLoading,
    hasError,
    isEmptyState,
    showFilters,
    showNoMatchMessage,
    onEditProduct,
    onDeleteProduct,
    allProducts,
    displayProducts,
    hasActiveFilters,
    onResetFilters,
  } = useOwnedShop(shop_id);

  if (isInitialLoading) {
    return <ShopLoadingState />;
  }

  if (hasError) {
    return <ShopErrorState />;
  }

  if (isEmptyState) {
    return <ShopEmptyState />;
  }

  const countMessage = hasActiveFilters
    ? `Showing ${displayProducts.length} of ${allProducts.length} products`
    : `${allProducts.length} products`;

  return (
    <ShopWrapper>
      <div className="space-y-6">
        {showFilters && <ProductFiltersContainer shop_id={shop_id} />}

        {showFilters && (
          <ShopProductListHeader
            countMessage={countMessage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onResetFilters}
          />
        )}
        <ProductListContainer
          onEditProduct={onEditProduct}
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
