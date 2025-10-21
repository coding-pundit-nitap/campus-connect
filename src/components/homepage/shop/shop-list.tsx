"use client";

import React from "react";

import { ProductSkeletonGrid } from "@/components/shared/shared-product-list";
import { useInfiniteScroll } from "@/hooks";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";

import { ShopCard } from "./shop-card";
import ShopGrid from "./shop-grid";
import { ShopListEmpty } from "./shop-list-empty";
import { ShopListError } from "./shop-list-error";
import ShopListFooter from "./shop-list-footer";

type Props = {
  shops: ShopWithOwnerDetails[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => void;
};

export default function ShopList({
  shops,
  isLoading,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) {
  const { lastElementRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return <ProductSkeletonGrid count={8} />;
  }
  if (isError && error) {
    return <ShopListError error={error} onRetry={fetchNextPage} />;
  }
  if (shops.length === 0) {
    return <ShopListEmpty />;
  }

  return (
    <div className="space-y-6">
      <ShopGrid>
        {shops.map((shop, index) => {
          const isLastShop = index === shops.length - 1;
          return (
            // Attach ref to the wrapper div of the last element
            <div
              key={shop.id}
              ref={isLastShop ? lastElementRef : null}
              className="animate-fade-in" // Add a subtle fade-in animation
            >
              <ShopCard shop={shop} priority={index < 8} />
            </div>
          );
        })}
      </ShopGrid>

      <ShopListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
