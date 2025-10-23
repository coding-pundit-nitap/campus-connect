import { Grid3X3, List } from "lucide-react";
import React, { useState } from "react";

import { ProductList } from "@/components/shared/shared-product-list";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Using shadcn ToggleGroup
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
            className="border rounded-md p-1"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="category" aria-label="Category view">
              <List className="h-4 w-4" />
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
        />
      )}
    </div>
  );
}
