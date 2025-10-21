"use client";

import React from "react";

import { useInfiniteShops } from "@/hooks";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";

import ShopList from "./shop-list";

type Props = {
  initialShops: ShopWithOwnerDetails[];
  hasNextPage: boolean;
  nextCursor: string | null;
  initialError?: string;
};

export function ShopsContainer({
  initialShops,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
  initialError,
}: Props) {
  const {
    allShops,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteShops({
    initialData: initialShops,
    initialHasNextPage,
    initialNextCursor,
    initialError,
  });

  return (
    <ShopList
      shops={allShops}
      isLoading={isLoading}
      isError={isError}
      error={error}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}
