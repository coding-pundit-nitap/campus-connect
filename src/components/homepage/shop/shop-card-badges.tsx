"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { ShopStatusBadge } from "@/components/ui/shop-status-badge";

import { useShopCard } from "./shop-card-context";

export function ShopCardBadges() {
  const { shop } = useShopCard();

  return (
    <div className="absolute top-2 right-2 flex gap-2">
      <ShopStatusBadge shop={shop} />
      {shop.is_active && !shop.accepting_orders && (
        <Badge variant="destructive" className="text-[11px] font-bold">
          Paused
        </Badge>
      )}
    </div>
  );
}
