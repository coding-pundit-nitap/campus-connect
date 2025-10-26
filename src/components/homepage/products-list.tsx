"use client";
import React from "react";

import { useInfiniteProducts } from "@/hooks/queries/useInfiniteProducts";
import { SerializedProduct } from "@/types/product.types";

import { ShopProductList } from "../shops/shop-product-list";

type Props = {
  initialProducts: SerializedProduct[];
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
  limit?: number;
};

export default function ProductsList({
  initialProducts,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
  initialError,
  limit,
}: Props) {
  const {
    allProducts: displayProducts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isAddingToCart,
    onAddToCart,
    onViewDetails,
  } = useInfiniteProducts({
    initialProducts,
    initialHasNextPage,
    initialNextCursor,
    initialError,
    limit,
  });
  return (
    <div className="flex-1 hide-scrollbar overflow-y-auto">
      <ShopProductList
        displayProducts={displayProducts}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        error={error}
        hasActiveFilters={false}
        hasNextPage={hasNextPage}
        isError={isError}
        isFetchingNextPage={isFetchingNextPage}
        isInitialLoading={false}
        hasError={!!error}
        isAddingToCart={isAddingToCart}
        onAddToCart={onAddToCart}
        onViewDetails={onViewDetails}
      />
    </div>
  );
}
