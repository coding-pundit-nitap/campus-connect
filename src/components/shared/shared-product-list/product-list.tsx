import React, { useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { SerializedProduct } from "@/types/product.types";

import { ProductGrid } from "./product-grid";
import { ProductListEmpty } from "./product-list-empty";
import { ProductListError } from "./product-list-error";
import { ProductListFooter } from "./product-list-footer";
import { ProductSkeletonGrid } from "./product-skeleton-grid";

interface ProductListProps {
  displayProducts: SerializedProduct[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  hasActiveFilters: boolean;

  fetchNextPage: () => void;

  renderProductCard: (
    product: SerializedProduct,
    index: number,
    isLastProduct: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;

  skeletonCount?: number;
  rootMargin?: string;
}

export function ProductList({
  displayProducts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  error,
  hasActiveFilters,
  renderProductCard,
  skeletonCount = 8,
  rootMargin = "100px",
}: ProductListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { lastElementRef } = useInfiniteScroll({
    hasNextPage: hasActiveFilters ? false : hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
  });

  if (isLoading && displayProducts.length === 0) {
    return <ProductSkeletonGrid count={skeletonCount} />;
  }

  if (isError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  if (!isLoading && displayProducts.length === 0) {
    return <ProductListEmpty />;
  }

  return (
    <div className="space-y-6">
      <ProductGrid
        products={displayProducts}
        lastElementRef={lastElementRef}
        renderProductCard={renderProductCard}
      />

      <ProductListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        displayProductsLength={displayProducts.length}
        onFetchNextPage={fetchNextPage}
      />

      <div ref={loadMoreRef} className="h-1" />
    </div>
  );
}
