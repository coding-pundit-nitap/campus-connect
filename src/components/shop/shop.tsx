"use client";
import React from "react";

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

  if (!shops.data || shops.data.length === 0) {
    return <ShopEmptyState />;
  }

  return (
    <ShopWrapper>
      {shops.data.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </ShopWrapper>
  );
}
