"use client";

import { CheckCircle, XCircle } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { ShopStatusBadge } from "@/components/ui/shop-status-badge";

import { useShopCard } from "./shop-card-context";

export function ShopCardBadges() {
  const { shop } = useShopCard();

  return (
    <div className="absolute top-2 right-2 flex gap-2">
      <Badge
        variant={shop.is_active ? "default" : "destructive"}
        className={shop.is_active ? "bg-green-500 hover:bg-green-600" : ""}
      >
        {shop.is_active ? (
          <CheckCircle className="mr-1 h-3 w-3" />
        ) : (
          <XCircle className="mr-1 h-3 w-3" />
        )}
        {shop.is_active ? "Active" : "Inactive"}
      </Badge>
      {shop.is_active && <ShopStatusBadge shop={shop} />}
    </div>
  );
}
