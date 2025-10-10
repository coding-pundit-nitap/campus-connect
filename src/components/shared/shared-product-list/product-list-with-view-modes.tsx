import { Grid3X3, List } from "lucide-react";
import React, { useState } from "react";

import {
  ProductList,
  ProductListError,
  ProductSkeletonGrid,
} from "@/components/shared/shared-product-list";
import { Button } from "@/components/ui/button";
import { SerializedProduct } from "@/types/product.types";

import { SharedProductsByCategory } from "./shared-products-by-category";

interface ProductListWithViewModesProps {
  displayProducts: SerializedProduct[];

  isInitialLoading: boolean;
  hasError: boolean;
  error: Error | null;

  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  hasActiveFilters?: boolean;

  fetchNextPage: () => void;

  renderProductCard: (
    product: SerializedProduct,
    index: number,
    isLastProduct?: boolean,
    isNearEnd?: boolean
  ) => React.ReactNode;

  defaultViewMode?: "grid" | "category";
  showViewModeToggle?: boolean;
  skeletonCount?: number;
}

export function ProductListWithViewModes({
  displayProducts,
  isInitialLoading,
  hasError,
  error,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  hasActiveFilters,
  fetchNextPage,
  renderProductCard,
  defaultViewMode = "grid",
  showViewModeToggle = true,
  skeletonCount = 4,
}: ProductListWithViewModesProps) {
  const [viewMode, setViewMode] = useState<"grid" | "category">(
    defaultViewMode
  );

  if (isInitialLoading) {
    return <ProductSkeletonGrid count={skeletonCount} />;
  }

  if (hasError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  return (
    <div className="flex flex-col h-full relative">
      {showViewModeToggle && (
        <div className="absolute top-0 right-0 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-1 m-2">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "category" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("category")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              By Category
            </Button>
          </div>
        </div>
      )}
      <div className="h-full hide-scrollbar overflow-y-auto">
        {viewMode === "category" ? (
          <SharedProductsByCategory
            products={displayProducts}
            renderProductCard={renderProductCard}
          />
        ) : (
          <ProductList
            displayProducts={displayProducts}
            isLoading={isLoading}
            fetchNextPage={fetchNextPage}
            error={error}
            hasActiveFilters={hasActiveFilters}
            hasNextPage={hasNextPage}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            renderProductCard={renderProductCard}
          />
        )}
      </div>
    </div>
  );
}
