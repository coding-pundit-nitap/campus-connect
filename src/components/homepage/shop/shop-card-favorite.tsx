"use client";

import React from "react";

import { FavoriteShopButton } from "@/components/shops/favorite-shop-button";

import { useShopCard } from "./shop-card-context";

export function ShopCardFavorite() {
  const { shop } = useShopCard();

  return (
    <div className="absolute top-2 left-2 z-10">
      <FavoriteShopButton shopId={shop.id} />
    </div>
  );
}
