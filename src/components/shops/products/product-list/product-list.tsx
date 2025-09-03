import { Product } from "@prisma/client";
import React, { useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ProductFormData } from "@/validations";

import { ProductGrid } from "./product-grid";
import { ProductListEmpty } from "./product-list-empty";
import { ProductListError } from "./product-list-error";
import { ProductListFooter } from "./product-list-footer";
import { ProductSkeletonGrid } from "./product-skeleton-grid";

interface ProductListProps {
  // Data
  displayProducts: Product[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  hasActiveFilters: boolean;

  // Handlers
  onEditProduct?: (product: ProductFormData) => void;
  onDeleteProduct?: (productId: string) => void;
  fetchNextPage: () => void;

  // Product card renderer
  renderProductCard: (
    product: Product,
    index: number,
    isLastProduct: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
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
  onEditProduct,
  onDeleteProduct,
  renderProductCard,
}: ProductListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { lastElementRef } = useInfiniteScroll({
    hasNextPage: hasActiveFilters ? false : hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin: "100px",
  });

  if (isLoading && displayProducts.length === 0) {
    return <ProductSkeletonGrid count={8} />;
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
        onEditProduct={onEditProduct}
        onDeleteProduct={onDeleteProduct}
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
