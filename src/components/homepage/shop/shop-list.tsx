import React from "react";

import { ProductSkeletonGrid } from "@/components/owned-shop/product-list/product-skeleton-grid";
import { useInfiniteScroll } from "@/hooks";
import { ShopWithOwner } from "@/types";

import ShopGrid from "./shop-grid";
import { ShopListEmpty } from "./shop-list-empty";
import { ShopListError } from "./shop-list-error";
import ShopListFooter from "./shop-list-footer";

type Props = {
  displayShops: ShopWithOwner[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  renderShopCard: (
    shop: ShopWithOwner,
    index: number,
    isLastShop: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
};

export default function ShopList({
  displayShops,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderShopCard,
  error,
  isError,
}: Props) {
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const { lastElementRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin: "100px",
  });

  if (isLoading) return <ProductSkeletonGrid count={8} />;
  if (isError && error) {
    return <ShopListError error={error} onRetry={fetchNextPage} />;
  }

  if (!isLoading && displayShops.length === 0) {
    return <ShopListEmpty />;
  }

  return (
    <div className="space-y-6">
      <ShopGrid
        shops={displayShops}
        lastElementRef={lastElementRef}
        renderShopCard={renderShopCard}
      />

      <ShopListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        displayShopsLength={displayShops.length}
        onFetchNextPage={fetchNextPage}
      />

      <div ref={loadMoreRef} className="h-1" />
    </div>
  );
}
