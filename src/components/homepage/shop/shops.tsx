"use client";

import ShopCard from "@/components/homepage/shop/shop-card";
import { useShops } from "@/hooks/useShops";

import ShopList from "./shop-list";

export function Shops() {
  const {
    allShops,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useShops();

  return (
    <ShopList
      displayShops={allShops}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      error={error}
      hasNextPage={hasNextPage}
      isError={isError}
      isFetchingNextPage={isFetchingNextPage}
      renderShopCard={(shop, index) => {
        return <ShopCard priority={index} shop={shop} />;
      }}
    />
  );
}
