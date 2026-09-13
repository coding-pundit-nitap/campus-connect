import { AnimatePresence, motion } from "framer-motion";
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
  renderSkeletonCard?: () => React.ReactNode;
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
  renderSkeletonCard,
}: ProductListProps) {
  const { lastElementRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <ProductSkeletonGrid
        count={skeletonCount}
        renderSkeletonCard={renderSkeletonCard}
      />
    );
  }

  if (isError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  if (products?.length === 0) {
    return <ProductListEmpty />;
  }

  return (
    <div className="space-y-6">
      <ProductGrid count={products?.length}>
        <AnimatePresence initial={false}>
          {products?.map((product, index) => {
            const isLastProduct = index === products.length - 1;
            return (
              <motion.div
                key={product.id}
                ref={isLastProduct ? lastElementRef : null}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {renderProductCard(product, index)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ProductGrid>

      <ProductListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
