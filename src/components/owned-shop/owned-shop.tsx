import React from "react";

import { useOwnedShop } from "@/hooks/useOwnedShop";
import { useOwnerProducts } from "@/hooks/useOwnerProducts";

import { ProductFiltersContainer } from "./product-filters";
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
  } = useOwnedShop(shop_id);

  const { clearFilters, allProducts, displayProducts, hasActiveFilters } =
    useOwnerProducts(shop_id);

  if (isInitialLoading) {
    return <ShopLoadingState />;
  }

  if (hasError) {
    return <ShopErrorState />;
  }

  if (isEmptyState) {
    return <ShopEmptyState />;
  }

  // Calculate count message
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
            onClearFilters={clearFilters}
          />
        )}
        <ProductListContainer
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          shop_id={shop_id}
        />

        {showNoMatchMessage && <NoMatchFilter onClearFilters={clearFilters} />}
      </div>
    </ShopWrapper>
  );
}

export default OwnedShop;
