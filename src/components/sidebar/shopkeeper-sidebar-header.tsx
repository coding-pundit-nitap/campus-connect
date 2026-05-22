"use client";

import { Store } from "lucide-react";
import React from "react";

import { useOwnerContext } from "@/components/owned-shop/owner-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUtils } from "@/lib/utils/image.utils";

export function ShopkeeperSidebarHeader() {
  const { shop, isLoading, error } = useOwnerContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex items-center gap-3 p-3 text-destructive">
        <Store className="h-8 w-8 text-muted-foreground" />
        <span className="text-xs font-semibold">Failed to load shop</span>
      </div>
    );
  }

  const shopImageUrl = shop.image_key
    ? ImageUtils.getImageUrl(shop.image_key)
    : undefined;

  const isAcceptingOrders = shop.accepting_orders;

  return (
    <div className="flex items-center gap-3 p-3 border-b border-sidebar-border bg-sidebar-accent/10">
      <Avatar className="h-10 w-10 rounded-lg border border-sidebar-border shadow-sm">
        <AvatarImage
          src={shopImageUrl}
          alt={shop.name}
          className="object-cover"
        />
        <AvatarFallback className="bg-muted">
          <Store className="h-5 w-5 text-muted-foreground/60" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate text-sm font-semibold text-sidebar-foreground">
          {shop.name}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge
            variant={isAcceptingOrders ? "default" : "secondary"}
            className={
              isAcceptingOrders
                ? "bg-green-500 hover:bg-green-500 text-white font-medium text-[10px] py-0 px-1.5 h-4.5"
                : "bg-amber-500 hover:bg-amber-500 text-white font-medium text-[10px] py-0 px-1.5 h-4.5"
            }
          >
            {isAcceptingOrders ? "Open" : "Paused"}
          </Badge>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Merchant
          </span>
        </div>
      </div>
    </div>
  );
}
