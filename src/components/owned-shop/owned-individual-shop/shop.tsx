"use client";

import { useShopByUser } from "@/hooks";

import { ShopHeaderCard } from "./shop-header-card";
import {
  ShopEmptyState,
  ShopErrorState,
  ShopLoadingState,
  ShopWrapper,
} from "./shop-state";

export default function Shop() {
  const shops = useShopByUser();

  if (shops.isLoading || shops.isFetching || shops.isPending) {
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
      <ShopHeaderCard shop={shops.data} />
    </ShopWrapper>
  );
}
