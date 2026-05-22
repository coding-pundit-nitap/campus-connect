import React from "react";

import { Badge } from "@/components/ui/badge";

import { useProductCard } from "./product-card-context";

const variantStyles = {
  default: {
    container: "absolute top-3 left-3 flex flex-col items-start gap-2",
    badge: "shadow-lg",
    lowStock: "border-orange-200 text-orange-600 shadow-lg",
    discount: "border-none bg-red-500 text-white shadow-lg",
  },
  compact: {
    container: "absolute top-1 left-1 flex flex-col gap-1",
    badge: "text-xs px-1.5 py-0.5 shadow-sm",
    lowStock:
      "border-orange-200 text-orange-600 text-xs px-1.5 py-0.5 shadow-sm",
    discount:
      "border-none bg-red-500 text-white text-xs px-1.5 py-0.5 shadow-sm",
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

  const showDiscount = hasDiscount && variant === "default";
  const showOutOfStock = isOutOfStock;
  const showLowStock = hasLowStock && !isOutOfStock;

  if (!showDiscount && !showOutOfStock && !showLowStock) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        {showDiscount && (
          <Badge className={styles.discount}>-{product.discount}% OFF</Badge>
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
        <div className="absolute inset-0 bg-white/60 dark:bg-black/60" />
      )}
    </>
  );
}
