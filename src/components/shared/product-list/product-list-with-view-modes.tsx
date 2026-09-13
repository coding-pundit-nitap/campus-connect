import { LayoutGrid, Tags } from "lucide-react";
import React, { useState } from "react";

import { ProductList } from "@/components/shared/product-list";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SerializedProduct } from "@/types/product.types";

import { SharedProductsByCategory } from "./shared-products-by-category";

interface ProductListWithViewModesProps {
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
  renderSkeletonCard?: () => React.ReactNode;

  defaultViewMode?: "grid" | "category";
  showViewModeToggle?: boolean;
}

export function ProductListWithViewModes({
  products,
  isLoading,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderProductCard,
  renderSkeletonCard,
  defaultViewMode = "grid",
  showViewModeToggle = true,
}: ProductListWithViewModesProps) {
  const [viewMode, setViewMode] = useState<"grid" | "category">(
    defaultViewMode
  );

  return (
    <div className="relative h-full">
      {showViewModeToggle && (
        <div className="mb-4 flex justify-end">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) {
                setViewMode(value as "grid" | "category");
              }
            }}
            className="border border-border rounded-lg p-1 bg-card"
          >
            <ToggleGroupItem
              value="grid"
              aria-label="Show all products"
              className="gap-1.5 px-3 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              All
            </ToggleGroupItem>
            <ToggleGroupItem
              value="category"
              aria-label="Group by category"
              className="gap-1.5 px-3 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Tags className="h-3.5 w-3.5" />
              By category
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {viewMode === "category" ? (
        <SharedProductsByCategory
          products={products}
          renderProductCard={renderProductCard}
        />
      ) : (
        <ProductList
          products={products}
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          renderProductCard={renderProductCard}
          renderSkeletonCard={renderSkeletonCard}
        />
      )}
    </div>
  );
}
