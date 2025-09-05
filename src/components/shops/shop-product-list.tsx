import React from "react";

import { useIndividualShop } from "@/hooks/useIndividualShop";
import { productUIServices } from "@/lib/utils-functions/product.utils";

import { ProductCard, UserProductActions } from "../shared/shared-product-card";
import {
  ProductList,
  ProductListError,
  ProductSkeletonGrid,
} from "../shared/shared-product-list";

type Props = {
  shop_id: string;
};

export default function IndividualProductList({ shop_id }: Props) {
  const {
    displayProducts,
    isLoading,
    fetchNextPage,
    error,
    hasActiveFilters,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isInitialLoading,
    hasError,
    onAddToCart,
    onViewDetails,
    isAddingToCart,
  } = useIndividualShop(shop_id);

  if (isInitialLoading) {
    return <ProductSkeletonGrid count={4} />;
  }

  if (hasError && error) {
    return <ProductListError error={error} onRetry={fetchNextPage} />;
  }

  return (
    <ProductList
      displayProducts={displayProducts}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      error={error}
      hasActiveFilters={hasActiveFilters}
      hasNextPage={hasNextPage}
      isError={isError}
      isFetchingNextPage={isFetchingNextPage}
      renderProductCard={(product, index) => {
        const cardProps = productUIServices.getProductCardProps(product, index);
        return (
          <ProductCard
            {...cardProps}
            product={product}
            mode="user"
            userActions={
              <UserProductActions
                isAddingToCart={isAddingToCart}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
                product={product}
              />
            }
          />
        );
      }}
    />
  );
}
