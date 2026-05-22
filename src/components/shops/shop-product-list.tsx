"use client";

import { UserProductCard } from "@/components/shared/product-card";
import { ProductListWithViewModes } from "@/components/shared/product-list";
import { SerializedProduct } from "@/types/product.types";

type Props = {
  displayProducts: SerializedProduct[];
  isLoading: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  onAddToCart?: (product_id: string, quantity: number) => void;
  onViewDetails?: (product_id: string) => void;
  isAddingToCart?: boolean;
};

export function ShopProductList({
  displayProducts,
  isLoading,
  fetchNextPage,
  error,
  hasNextPage,
  isError,
  isFetchingNextPage,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
}: Props) {
  const renderProductCard = (product: SerializedProduct, index: number) => (
    <UserProductCard
      product={product}
      index={index}
      onAddToCart={onAddToCart || (() => {})}
      onViewDetails={onViewDetails || (() => {})}
      isAddingToCart={isAddingToCart || false}
    />
  );

  return (
    <ProductListWithViewModes
      products={displayProducts}
      error={error}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      renderProductCard={renderProductCard}
      showViewModeToggle={true}
    />
  );
}
