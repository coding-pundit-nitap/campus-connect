"use client";
import React from "react";

import { ProductCard } from "@/components/shared/shared-product-card";
import { ProductListWithViewModes } from "@/components/shared/shared-product-list/product-list-with-view-modes";
import { useOwnedShop } from "@/hooks";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { SerializedProduct } from "@/types/product.types";

interface ProductListProps {
  onDeleteProduct: (product_id: string, imageKey: string) => Promise<void>;
  error?: Error | null;
  shop_id: string;
  shopData?: ReturnType<typeof useOwnedShop>;
}

export function ProductListContainer({
  onDeleteProduct,
  shop_id,
  shopData,
}: ProductListProps) {
  const ownShopData = useOwnedShop(shop_id);
  const data = shopData || ownShopData;

  const {
    displayProducts,
    error,
    hasActiveFilters,
    isInitialLoading,
    hasError,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = data;

  const renderProductCard = (product: SerializedProduct, index: number) => {
    const cardProps = productUIServices.getProductCardProps(product, index);
    return (
      <ProductCard
        {...cardProps}
        product={product}
        mode="owner"
        onDelete={onDeleteProduct}
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
