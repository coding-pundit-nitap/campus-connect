"use client";
import React from "react";

import { OwnerProductCard } from "@/components/shared/product-card";
import { ProductListWithViewModes } from "@/components/shared/product-list/product-list-with-view-modes";
import { SerializedProduct } from "@/types/product.types";

interface ProductListProps {
  onDeleteProduct: (product_id: string, image_key: string) => Promise<void>;
  shopData: {
    displayProducts: SerializedProduct[];
    isLoading: boolean;
    isError: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
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
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = shopData;

  const renderProductCard = (product: SerializedProduct, index: number) => (
    <OwnerProductCard
      product={product}
      index={index}
      onDelete={onDeleteProduct}
    />
  );

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
