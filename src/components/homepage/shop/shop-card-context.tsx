"use client";

import { createContext, use, useMemo } from "react";

import { sanitizeHTML } from "@/lib/sanitize";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils/image.utils";

interface ShopCardContextValue {
  shop: ShopWithOwnerDetails;
  shopImageUrl: string;
  descriptionHtml: string;
  priority: boolean;
}

const ShopCardContext = createContext<ShopCardContextValue | null>(null);

export function ShopCardProvider({
  shop,
  priority = false,
  children,
}: {
  shop: ShopWithOwnerDetails;
  priority?: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      shop,
      shopImageUrl: ImageUtils.getImageUrl(shop.image_key),
      descriptionHtml: sanitizeHTML(shop.description),
      priority,
    }),
    [shop, priority]
  );

  return (
    <ShopCardContext.Provider value={value}>
      {children}
    </ShopCardContext.Provider>
  );
}

export function useShopCard() {
  const context = use(ShopCardContext);
  if (!context) {
    throw new Error("useShopCard must be used within a ShopCardProvider");
  }
  return context;
}
