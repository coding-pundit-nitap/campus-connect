import React from "react";

import {
  NoMatchFilter,
  ProductFiltersContainer,
} from "@/components/shared/shared-product-filters";
import { useOwnedShop } from "@/hooks/useOwnedShop";

import { ProductListContainer } from "./product-list";
import { ShopEmptyState } from "./shop-states/shop-empty-state";
import { ShopWrapper } from "./shop-states/shop-wrapper";

interface OwnedShopProps {
  shop_id: string;
}

export function OwnedShop({ shop_id }: OwnedShopProps) {
  const { isEmptyState, showNoMatchMessage, onDeleteProduct, onResetFilters } =
    useOwnedShop(shop_id);

  if (isEmptyState) {
    return <ShopEmptyState />;
  }

  return (
    <ShopWrapper>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 space-y-4 pb-4">
          <ProductFiltersContainer shop_id={shop_id} />
        </div>
        <div className="flex-1 hide-scrollbar overflow-y-auto">
          <ProductListContainer
            onDeleteProduct={onDeleteProduct}
            shop_id={shop_id}
          />

          {showNoMatchMessage && (
            <NoMatchFilter onClearFilters={onResetFilters} />
          )}
        </div>
      </div>
    </ShopWrapper>
  );
}

export default OwnedShop;
