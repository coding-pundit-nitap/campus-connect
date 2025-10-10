"use client";

import React from "react";

import {
  ProductCard,
  UserProductActions,
} from "@/components/shared/shared-product-card";
import { ProductListWithViewModes } from "@/components/shared/shared-product-list";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { SerializedProduct } from "@/types/product.types";

type Props = {
  displayProducts: SerializedProduct[];
  isLoading: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  hasActiveFilters: boolean;
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isInitialLoading: boolean;
  hasError: boolean;
  onAddToCart?: (product_id: string, quantity: number) => void;
  onViewDetails?: (product_id: string, shop_id: string) => void;
  isAddingToCart?: boolean;
};

export function ShopProductList({
  displayProducts,
  isLoading,
  fetchNextPage,
  error,
  hasActiveFilters,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isInitialLoading,
  hasError,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
}: Props) {
  const renderProductCard = (product: SerializedProduct, index: number) => {
    const cardProps = productUIServices.getProductCardProps(product, index);
    return (
      <ProductCard
        {...cardProps}
        product={product}
        mode="user"
        userActions={
          <UserProductActions
            isAddingToCart={isAddingToCart || false}
            onAddToCart={onAddToCart || (() => {})}
            onViewDetails={onViewDetails || (() => {})}
            product_id={product.id}
            shop_id={product.shop_id}
            stock={product.stock_quantity}
          />
        }
      />
    );
  };

  return (
    <ProductListWithViewModes
      displayProducts={displayProducts}
      isInitialLoading={isInitialLoading}
      hasError={hasError}
      error={error}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      hasActiveFilters={hasActiveFilters}
      fetchNextPage={fetchNextPage}
      renderProductCard={renderProductCard}
      showViewModeToggle={true}
      skeletonCount={4}
    />
  );
}
