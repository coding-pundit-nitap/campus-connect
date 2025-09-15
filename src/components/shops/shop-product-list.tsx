import React from "react";

import {
  ProductCard,
  UserProductActions,
} from "@/components/shared/shared-product-card";
import { ProductListWithViewModes } from "@/components/shared/shared-product-list";
import { useIndividualShop } from "@/hooks/useIndividualShop";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { SerializedProduct } from "@/types/product.types";

type Props = {
  shop_id: string;
  shopData?: ReturnType<typeof useIndividualShop>;
};

export default function IndividualProductList({ shop_id, shopData }: Props) {
  const ownShopData = useIndividualShop(shop_id);
  const data = shopData || ownShopData;

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
  } = data;

  const renderProductCard = (product: SerializedProduct, index: number) => {
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
            product_id={product.id}
            stock={product.stock_quantity}
          />
        }
      />
    );
  };

  return (
    <ProductListWithViewModes
      displayProducts={displayProducts}
      isInitialLoading={isInitialLoading}
      hasError={hasError}
      error={error}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      hasActiveFilters={hasActiveFilters}
      fetchNextPage={fetchNextPage}
      renderProductCard={renderProductCard}
      showViewModeToggle={true}
      skeletonCount={4}
    />
  );
}
