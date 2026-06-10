import React from "react";

import { Badge } from "@/components/ui/badge";

import { useProductCard } from "./product-card-context";

const variantStyles = {
  default: {
    container: "absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10",
    badge:
      "shadow-xs font-black rounded-md border border-border bg-card text-foreground text-[9px] tracking-wider uppercase px-2 py-0.5",
    lowStock:
      "border border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-black rounded-md shadow-xs text-[9px] tracking-wider uppercase px-2 py-0.5 animate-pulse",
    discount:
      "border border-orange-600/20 bg-orange-500 text-white font-black rounded-md shadow-xs uppercase tracking-wider text-[9px] px-2 py-0.5",
  },
  compact: {
    container: "absolute top-1.5 left-1.5 flex flex-col gap-1 z-10",
    badge:
      "text-[8px] px-1.5 py-0.5 shadow-xs rounded-sm font-black tracking-wider uppercase border border-border bg-card text-foreground",
    lowStock:
      "border border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[8px] px-1.5 py-0.5 shadow-xs rounded-sm font-black tracking-wider uppercase",
    discount:
      "border border-orange-600/20 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 shadow-xs rounded-sm font-black tracking-wider uppercase",
  },
} as const;

interface ProductCardBadgesProps {
  variant?: "default" | "compact";
}

export function ProductCardBadges({
  variant = "default",
}: ProductCardBadgesProps) {
  const { hasDiscount, isOutOfStock, hasLowStock, product } = useProductCard();
  const styles = variantStyles[variant];

  const showDiscount = hasDiscount;
  const showOutOfStock = isOutOfStock;
  const showLowStock = hasLowStock && !isOutOfStock;

  if (!showDiscount && !showOutOfStock && !showLowStock) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        {showDiscount && (
          <Badge className={styles.discount}>-{product.discount}%</Badge>
        )}
        {showOutOfStock && (
          <Badge variant="secondary" className={styles.badge}>
            Out of Stock
          </Badge>
        )}
        {showLowStock && (
          <Badge variant="secondary" className={styles.lowStock}>
            Low Stock
          </Badge>
        )}
      </div>
      {isOutOfStock && (
        <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[1px] pointer-events-none transition-all duration-300" />
      )}
    </>
  );
}
