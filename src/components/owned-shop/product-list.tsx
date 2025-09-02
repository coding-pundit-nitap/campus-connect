"use client";
import React from "react";

import { useOwnerProducts } from "@/hooks/useOwnerProducts";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { ProductFormData } from "@/validations";

import { ProductCard } from "./product-card/product-card";
import { ProductList } from "./product-list/product-list";

interface ProductListProps {
  onEditProduct: (product: ProductFormData) => void;
  onDeleteProduct: (productId: string) => void;
  error?: Error | null;
  shop_id: string;
}

export function ProductListContainer({
  onEditProduct,
  onDeleteProduct,
  shop_id,
}: ProductListProps) {
  const {
    displayProducts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    hasActiveFilters,
  } = useOwnerProducts(shop_id);

  return (
    <ProductList
      displayProducts={displayProducts}
      onEditProduct={onEditProduct}
      onDeleteProduct={onDeleteProduct}
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
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        );
      }}
    />
  );
}
