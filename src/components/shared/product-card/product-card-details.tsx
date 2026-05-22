import { Star } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

import { useProductCard } from "./product-card-context";

const variantStyles = {
  default: {
    container: "p-5 space-y-4",
    spacing: "space-y-1.5",
    title: "text-lg",
    price: "text-2xl",
    strikethrough: "text-sm",
    discountBadge: "text-[10px] px-2 py-0.5 font-bold rounded-full",
    rating: "px-2.5 py-0.5 text-xs font-semibold",
    ratingIcon: "h-3.5 w-3.5 fill-current",
    ratingText: "",
    stockRow: "text-xs font-medium",
    categoryBadge:
      "bg-indigo-500/5 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25 font-semibold text-[11px] rounded-full px-2.5 py-0.5",
    showDescription: true,
  },
  compact: {
    container: "p-3 space-y-2",
    spacing: "space-y-0.5",
    title: "text-sm",
    price: "text-lg",
    strikethrough: "text-xs",
    discountBadge: "text-[8px] px-1.5 py-0 font-bold rounded-full",
    rating: "px-1.5 py-0 text-[10px] font-semibold",
    ratingIcon: "h-2.5 w-2.5 fill-current",
    ratingText: "text-[10px]",
    stockRow: "text-[10px] font-medium",
    categoryBadge:
      "bg-indigo-500/5 text-indigo-600 border border-indigo-500/15 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold text-[9px] rounded-full px-1.5 py-0",
    showDescription: false,
  },
} as const;

function getRatingClasses(rating: number): string {
  if (rating >= 4.5)
    return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/35";
  if (rating >= 4.0)
    return "bg-sky-500/10 text-sky-600 border border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/35";
  if (rating >= 3.0)
    return "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/35";
  return "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/35";
}

function getStockInfo(stockQuantity: number) {
  if (stockQuantity === 0) {
    return {
      text: "Out of Stock",
      colorClass: "text-rose-600 dark:text-rose-400",
      dotClass: "bg-rose-500 dark:bg-rose-400",
    };
  }
  if (stockQuantity <= 5) {
    return {
      text: "Low Stock",
      colorClass: "text-amber-500 dark:text-amber-400 font-bold",
      dotClass: "bg-amber-500 dark:bg-amber-400 animate-pulse",
    };
  }
  return {
    text: "In Stock",
    colorClass: "text-emerald-600 dark:text-emerald-400 font-medium",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
  };
}

interface ProductCardDetailsProps {
  variant?: "default" | "compact";
}

export function ProductCardDetails({
  variant = "default",
}: ProductCardDetailsProps) {
  const { product, discountedPrice, hasDiscount, hasRating } = useProductCard();
  const styles = variantStyles[variant];
  const stockInfo = getStockInfo(product.stock_quantity);
  const ratingClasses = getRatingClasses(product.rating || 0);

  return (
    <div className={cn("flex flex-col", styles.container)}>
      <div className="flex items-center justify-between text-xs gap-2">
        {product.category ? (
          <Badge variant="outline" className={styles.categoryBadge}>
            {product.category.name}
          </Badge>
        ) : (
          <span />
        )}
        {hasRating && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full backdrop-blur-xs shadow-xs",
              ratingClasses,
              styles.rating
            )}
          >
            <Star className={styles.ratingIcon} />
            <span className={cn("font-bold leading-none", styles.ratingText)}>
              {product.rating!.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.spacing}>
        <h3
          className={cn(
            "truncate font-extrabold tracking-tight leading-tight text-foreground transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
            styles.title
          )}
        >
          {product.name}
        </h3>
        {product.description && styles.showDescription && (
          <div
            className="min-h-10 text-xs leading-relaxed text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(product.description) || "",
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "font-black tracking-tight text-foreground",
            styles.price
          )}
        >
          ₹{discountedPrice}
        </span>
        {hasDiscount && (
          <>
            <span
              className={cn(
                "text-muted-foreground/60 font-semibold line-through",
                styles.strikethrough
              )}
            >
              ₹{product.price}
            </span>
            <Badge
              variant="destructive"
              className={cn(
                "border-none bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-xs",
                styles.discountBadge
              )}
            >
              {product.discount}% OFF
            </Badge>
          </>
        )}
      </div>

      <div
        className={cn(
          "flex items-center gap-1.5 text-muted-foreground/80 border-t border-muted/30 pt-2.5",
          styles.stockRow
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0 shadow-xs",
            stockInfo.dotClass
          )}
        />
        <span className={stockInfo.colorClass}>{stockInfo.text}</span>
        <span className="text-[10px] opacity-75">
          ({product.stock_quantity} left)
        </span>
      </div>
    </div>
  );
}
