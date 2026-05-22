"use client";

import { useState } from "react";

import { useInfiniteProducts } from "@/hooks/queries/useInfiniteProducts";
import { SerializedProduct } from "@/types/product.types";

import { ShopProductList } from "../shops/shop-product-list";
import CategoryPills from "./category-pills";
import FavoriteShopsStrip from "./favorite-shops-strip";
import HotDeals from "./hot-deals";
import OrderAgain from "./order-again";
import SmartHero from "./smart-hero";

type Props = {
  initialProducts: SerializedProduct[];
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
  limit?: number;
};

export default function ProductsList({
  initialProducts,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
  initialError,
  limit,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const {
    allProducts: displayProducts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isAddingToCart,
    onAddToCart,
    onViewDetails,
  } = useInfiniteProducts({
    initialProducts,
    initialHasNextPage,
    initialNextCursor,
    initialError,
    limit,
    categoryId: selectedCategoryId || undefined,
  });

  return (
    <div className="flex-1 hide-scrollbar overflow-y-auto">
      {!selectedCategoryId && <SmartHero />}
      <div id="category-pills-section">
        <CategoryPills
          selectedId={selectedCategoryId}
          onChange={setSelectedCategoryId}
        />
      </div>
      {!selectedCategoryId && <FavoriteShopsStrip />}
      {!selectedCategoryId && <OrderAgain displayProducts={displayProducts} />}
      {!selectedCategoryId && (
        <div id="hot-deals-section">
          <HotDeals />
        </div>
      )}
      <div id="products-feed-section">
        <ShopProductList
          displayProducts={displayProducts}
          isLoading={isLoading}
          fetchNextPage={fetchNextPage}
          error={error}
          hasNextPage={hasNextPage}
          isError={isError}
          isFetchingNextPage={isFetchingNextPage}
          isAddingToCart={isAddingToCart}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );
}
