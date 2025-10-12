import React from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { SerializedProduct } from "@/types/product.types";

import { ProductGrid } from "./product-grid";
import { ProductListEmpty } from "./product-list-empty";
import { ProductListError } from "./product-list-error";
import { ProductListFooter } from "./product-list-footer";
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

  // Handle initial loading state
  if (isLoading) {
    return <ProductSkeletonGrid count={skeletonCount} />;
  }

  // Handle error state
  if (isError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  // Handle empty state
  if (products?.length === 0) {
    return <ProductListEmpty />;
  }

  // Render the product grid
  return (
    <div className="space-y-6">
      <ProductGrid>
        {products?.map((product, index) => {
          // Attach the ref to the last product card's wrapper
          const isLastProduct = index === products.length - 1;
          return (
            <div
              key={product.id}
              ref={isLastProduct ? lastElementRef : null}
              className="animate-fade-in" // Add a subtle fade-in animation
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
