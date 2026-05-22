import { Package, Star } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { sanitizeHTML } from "@/lib/sanitize";

import { useProductCard } from "./product-card-context";

const variantStyles = {
  default: {
    container: "p-4",
    spacing: "space-y-1",
    title: "text-lg",
    price: "text-2xl",
    strikethrough: "text-sm",
    discountBadge: "",
    rating: "px-2 py-0.5",
    ratingIcon: "h-3 w-3",
    ratingText: "",
    stockRow: "text-sm",
    stockIcon: "h-4 w-4",
    categoryBadge: "",
    showDescription: true,
  },
  compact: {
    container: "p-2",
    spacing: "space-y-0.5",
    title: "text-sm",
    price: "text-lg",
    strikethrough: "text-xs",
    discountBadge: "text-[10px] px-1.5 py-0",
    rating: "px-1.5 py-0",
    ratingIcon: "h-2.5 w-2.5",
    ratingText: "text-[10px]",
    stockRow: "text-xs",
    stockIcon: "h-3 w-3",
    categoryBadge: "text-[10px] px-1.5 py-0",
    showDescription: false,
  },
} as const;

function getRatingClasses(rating: number): string {
  if (rating >= 4.5) return "bg-green-100 text-green-800";
  if (rating >= 4.0) return "bg-sky-100 text-sky-800";
  if (rating >= 3.0) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function getStockInfo(stockQuantity: number) {
  if (stockQuantity === 0) {
    return { text: "Out of Stock", className: "text-red-600" };
  }
  if (stockQuantity <= 5) {
    return { text: "Low Stock", className: "text-orange-500 font-semibold" };
  }
  return { text: "In Stock", className: "text-green-600" };
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
    <div className={`flex flex-col gap-3 ${styles.container}`}>
      <div className="flex items-center justify-between text-xs">
        {product.category ? (
          <Badge variant="outline" className={styles.categoryBadge}>
            {product.category.name}
          </Badge>
        ) : (
          <span />
        )}
        {hasRating && (
          <div
            className={`flex items-center gap-1.5 rounded-full ${ratingClasses} ${styles.rating}`}
          >
            <Star className={styles.ratingIcon} />
            <span className={`font-bold ${styles.ratingText}`}>
              {product.rating!.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.spacing}>
        <h3 className={`truncate font-semibold leading-tight ${styles.title}`}>
          {product.name}
        </h3>
        {product.description && styles.showDescription && (
          <div
            className="min-h-10 text-sm leading-relaxed text-muted-foreground line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(product.description) || "",
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={`font-bold text-primary ${styles.price}`}>
          ₹{discountedPrice}
        </span>
        {hasDiscount && (
          <>
            <span
              className={`text-muted-foreground line-through ${styles.strikethrough}`}
            >
              ₹{product.price}
            </span>
            <Badge
              variant="destructive"
              className={`border-none bg-green-500 hover:bg-green-600 ${styles.discountBadge}`}
            >
              {product.discount}% OFF
            </Badge>
          </>
        )}
      </div>

      <div
        className={`flex items-center gap-2 text-muted-foreground ${styles.stockRow}`}
      >
        <Package className={styles.stockIcon} />
        <span className={stockInfo.className}>{stockInfo.text}</span>
        <span>({product.stock_quantity} left)</span>
      </div>
    </div>
  );
}
