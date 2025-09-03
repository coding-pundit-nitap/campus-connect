"use client";

import { useShopByUser } from "@/hooks";

import ShopCard from "./shop-card";
import {
  ShopEmptyState,
  ShopErrorState,
  ShopLoadingState,
  ShopWrapper,
} from "./shop-state";

export default function Shop() {
  const shops = useShopByUser();

  if (shops.isLoading) {
    return <ShopLoadingState />;
  }
  if (shops.error) {
    return <ShopErrorState />;
  }

  if (!shops.data) {
    return <ShopEmptyState />;
  }

  return (
    <ShopWrapper>
      <ShopCard key={shops.data.id} shop={shops.data} />
    </ShopWrapper>
  );
}
