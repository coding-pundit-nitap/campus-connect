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
      <Card className="flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-border/40 bg-card shadow-[3px_3px_0px_0px_rgba(217,155,26,0.14)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(217,155,26,0.3)] hover:border-primary/40">
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
