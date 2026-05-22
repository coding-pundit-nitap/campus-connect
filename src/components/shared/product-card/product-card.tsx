import React from "react";

import { CardFooter } from "@/components/ui/card";

import { ProductCardBadges } from "./product-card-badges";
import { ProductCardProvider } from "./product-card-context";
import { ProductCardDetails } from "./product-card-details";
import { ProductCardImage } from "./product-card-header";

/**
 * ProductCard compound component namespace.
 *
 * Usage:
 * ```tsx
 * <ProductCard.Provider product={product} priority={index < 4}>
 *   <ProductCard.Frame variant="interactive">
 *     <ProductCard.Image />
 *     <ProductCard.Badges />
 *     <ProductCard.Details />
 *     <ProductCard.Actions>
 *       <YourCustomActions />
 *     </ProductCard.Actions>
 *   </ProductCard.Frame>
 * </ProductCard.Provider>
 * ```
 *
 * For pre-built variants, use:
 * - `UserProductCard` — user-facing card with add-to-cart, watchlist
 * - `OwnerProductCard` — owner card with edit/delete actions
 */

interface ProductCardFrameProps {
  variant?: "interactive" | "elevated";
  children: React.ReactNode;
}

function ProductCardFrame({
  variant = "interactive",
  children,
}: ProductCardFrameProps) {
  const frameClasses =
    variant === "elevated"
      ? "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-lg"
      : "group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-xl";

  return <div className={frameClasses}>{children}</div>;
}

interface ProductCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

function ProductCardActions({ children, className }: ProductCardActionsProps) {
  return <CardFooter className={className}>{children}</CardFooter>;
}

export const ProductCard = {
  Provider: ProductCardProvider,
  Image: ProductCardImage,
  Details: ProductCardDetails,
  Badges: ProductCardBadges,
  Frame: ProductCardFrame,
  Actions: ProductCardActions,
};
