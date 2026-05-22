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
    <div className="group block h-full w-full">
      <Card className="flex h-full w-full flex-col overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
