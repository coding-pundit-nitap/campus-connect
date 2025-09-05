"use client";
import React from "react";

import { ProductCard } from "@/components/shared/shared-product-card";
import {
  ProductList,
  ProductListError,
  ProductSkeletonGrid,
} from "@/components/shared/shared-product-list";
import { useOwnedShop } from "@/hooks";
import { useOwnerProducts } from "@/hooks/useOwnerProducts";
import { productUIServices } from "@/lib/utils-functions/product.utils";

interface ProductListProps {
  onDeleteProduct: (productId: string) => void;
  error?: Error | null;
  shop_id: string;
}

export function ProductListContainer({
  onDeleteProduct,
  shop_id,
}: ProductListProps) {
  const { isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useOwnerProducts(shop_id);
  const {
    displayProducts,
    error,
    hasActiveFilters,
    isInitialLoading,
    hasError,
  } = useOwnedShop(shop_id);

  if (isInitialLoading) {
    return <ProductSkeletonGrid count={4} />;
  }

  if (hasError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  return (
    <ProductList
      displayProducts={displayProducts}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      error={error}
      hasActiveFilters={hasActiveFilters}
      hasNextPage={hasNextPage}
      isError={isError}
      isFetchingNextPage={isFetchingNextPage}
      renderProductCard={(product, index) => {
        const cardProps = productUIServices.getProductCardProps(product, index);
        return (
          <ProductCard
            {...cardProps}
            product={product}
            mode="owner"
            onDelete={onDeleteProduct}
          />
        );
      }}
    />
  );
}
