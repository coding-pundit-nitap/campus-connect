"use client";
import React from "react";

import { ProductCard } from "@/components/shared/shared-product-card";
import { ProductListWithViewModes } from "@/components/shared/shared-product-list/product-list-with-view-modes";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { SerializedProduct } from "@/types/product.types";

interface ProductListProps {
  onDeleteProduct: (product_id: string, imageKey: string) => Promise<void>;
  shopData: {
    displayProducts: SerializedProduct[];
    isInitialLoading: boolean;
    hasError: boolean;
    isLoading: boolean;
    isError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    hasActiveFilters?: boolean;
    error: Error | null;
  };
}

export function ProductListContainer({
  onDeleteProduct,
  shopData,
}: ProductListProps) {
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
  } = shopData;

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
      products={displayProducts}
      error={error}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      renderProductCard={renderProductCard}
      showViewModeToggle={true}
    />
  );
}
