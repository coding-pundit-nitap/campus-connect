"use client";

import React from "react";

import { Card } from "@/components/ui/card";

import { ShopCardActions } from "./shop-card-actions";
import { ShopCardBadges } from "./shop-card-badges";
import { ShopCardProvider } from "./shop-card-context";
import { ShopCardDetails } from "./shop-card-details";
import { ShopCardFavorite } from "./shop-card-favorite";
import { ShopCardImage } from "./shop-card-image";

/**
 * ShopCard compound component namespace.
 *
 * Usage:
 * ```tsx
 * <ShopCard.Provider shop={shop} priority={index < 4}>
 *   <ShopCard.Frame>
 *     <ShopCard.Image>
 *       <ShopCard.Favorite />
 *       <ShopCard.Badges />
 *     </ShopCard.Image>
 *     <ShopCard.Details />
 *     <ShopCard.Actions />
 *   </ShopCard.Frame>
 * </ShopCard.Provider>
 * ```
 */

interface ShopCardFrameProps {
  children: React.ReactNode;
}

function ShopCardFrame({ children }: ShopCardFrameProps) {
  return (
    <div className="group block h-full w-full relative">
      <Card className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/20 bg-card to-primary/[0.02] shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/20 dark:hover:shadow-blue-950/20 dark:hover:border-blue-500/30">
        {children}
      </Card>
    </div>
  );
}

export const ShopCard = {
  Provider: ShopCardProvider,
  Image: ShopCardImage,
  Badges: ShopCardBadges,
  Favorite: ShopCardFavorite,
  Details: ShopCardDetails,
  Actions: ShopCardActions,
  Frame: ShopCardFrame,
};
