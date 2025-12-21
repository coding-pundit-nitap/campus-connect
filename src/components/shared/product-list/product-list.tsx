import React from "react";

import { useInfiniteScroll } from "@/hooks/utils/useInfiniteScroll";
import { SerializedProduct } from "@/types/product.types";

import { ProductGrid } from "./product-grid";
import {
  ProductListEmpty,
  ProductListError,
  ProductListFooter,
} from "./product-list-states";
import { ProductSkeletonGrid } from "./product-skeleton-grid";

interface ProductListProps {
  products: SerializedProduct[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  renderProductCard: (
    product: SerializedProduct,
    index: number
  ) => React.ReactNode;
  skeletonCount?: number;
}

export function ProductList({
  products,
  isLoading,
  isError,
  error,
  hasNextPage = false,
  isFetchingNextPage,
  fetchNextPage,
  renderProductCard,
  skeletonCount = 8,
}: ProductListProps) {
  const { lastElementRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return <ProductSkeletonGrid count={skeletonCount} />;
  }

  if (isError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  if (products?.length === 0) {
    return <ProductListEmpty />;
  }

  return (
    <div className="space-y-6">
      <ProductGrid>
        {products?.map((product, index) => {
          const isLastProduct = index === products.length - 1;
          return (
            <div
              key={product.id}
              ref={isLastProduct ? lastElementRef : null}
              className="animate-fade-in"
            >
              {renderProductCard(product, index)}
            </div>
          );
        })}
      </ProductGrid>

      <ProductListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
