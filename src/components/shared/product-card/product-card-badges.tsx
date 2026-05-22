import React from "react";

import { Badge } from "@/components/ui/badge";

import { useProductCard } from "./product-card-context";

const variantStyles = {
  default: {
    container: "absolute top-3 left-3 flex flex-col items-start gap-2 z-10",
    badge:
      "shadow-md font-bold rounded-lg border border-slate-800/20 bg-slate-950/85 backdrop-blur-md text-white text-[10px] tracking-wider uppercase px-2.5 py-1",
    lowStock:
      "border border-amber-500/30 bg-amber-500/90 backdrop-blur-md text-white font-bold rounded-lg shadow-md text-[10px] tracking-wider uppercase px-2.5 py-1",
    discount:
      "border-none bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black rounded-lg shadow-sm uppercase tracking-wider text-[10px] px-2.5 py-1",
  },
  compact: {
    container: "absolute top-1.5 left-1.5 flex flex-col gap-1.5 z-10",
    badge:
      "text-[8px] px-1.5 py-0.5 shadow-sm rounded-md font-bold tracking-wider uppercase border border-slate-800/20 bg-slate-950/85 backdrop-blur-md text-white",
    lowStock:
      "border border-amber-500/30 bg-amber-500/90 text-white text-[8px] px-1.5 py-0.5 shadow-sm rounded-md font-bold tracking-wider uppercase",
    discount:
      "border-none bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[8px] px-1.5 py-0.5 shadow-sm rounded-md font-black tracking-wider uppercase",
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
