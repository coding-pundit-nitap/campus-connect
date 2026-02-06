import { Package, Star } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { sanitizeHTML } from "@/lib/sanitize";
import { SerializedProduct } from "@/types/product.types";

interface ProductCardDetailsProps {
  product: SerializedProduct;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
  isMobileList?: boolean;
}

export function ProductCardDetails({
  product,
  discountedPrice,
  productHasDiscount,
  productHasRating,
  isMobileList = false,
}: ProductCardDetailsProps) {
  const stockInfo = (() => {
    const { stock_quantity } = product;
    if (stock_quantity === 0) {
      return { text: "Out of Stock", className: "text-red-600" };
    }
    if (stock_quantity <= 5) {
      return { text: "Low Stock", className: "text-orange-500 font-semibold" };
    }
    return { text: "In Stock", className: "text-green-600" };
  })();

  const ratingClasses = (() => {
    const rating = product.rating || 0;
    if (rating >= 4.5) {
      return "bg-green-100 text-green-800";
    }
    if (rating >= 4.0) {
      return "bg-sky-100 text-sky-800";
    }
    if (rating >= 3.0) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-red-100 text-red-800";
  })();

  return (
    <div className={`flex flex-col gap-3 ${isMobileList ? "p-2" : "p-4"}`}>
      <div className="flex items-center justify-between text-xs">
        {product.category ? (
          <Badge
            variant="outline"
            className={isMobileList ? "text-[10px] px-1.5 py-0" : ""}
          >
            {product.category.name}
          </Badge>
        ) : (
          <span />
        )}
        {productHasRating && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 ${ratingClasses} ${isMobileList ? "px-1.5 py-0" : ""}`}
          >
            <Star className={isMobileList ? "h-2.5 w-2.5" : "h-3 w-3"} />
            <span className={`font-bold ${isMobileList ? "text-[10px]" : ""}`}>
              {product.rating!.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className={isMobileList ? "space-y-0.5" : "space-y-1"}>
        <h3
          className={`truncate font-semibold leading-tight ${isMobileList ? "text-sm" : "text-lg"}`}
        >
          {product.name}
        </h3>
        {product.description && !isMobileList && (
          <div
            className="min-h-10 text-sm leading-relaxed text-muted-foreground line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(product.description) || "",
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={`font-bold text-primary ${isMobileList ? "text-lg" : "text-2xl"}`}
        >
          ₹{discountedPrice}
        </span>
        {productHasDiscount && (
          <>
            <span
              className={`text-muted-foreground line-through ${isMobileList ? "text-xs" : "text-sm"}`}
            >
              ₹{product.price}
            </span>
            <Badge
              variant="destructive"
              className={`border-none bg-green-500 hover:bg-green-600 ${isMobileList ? "text-[10px] px-1.5 py-0" : ""}`}
            >
              {product.discount}% OFF
            </Badge>
          </>
        )}
      </div>

      <div
        className={`flex items-center gap-2 text-muted-foreground ${isMobileList ? "text-xs" : "text-sm"}`}
      >
        <Package className={isMobileList ? "h-3 w-3" : "h-4 w-4"} />
        <span className={stockInfo.className}>{stockInfo.text}</span>
        <span>({product.stock_quantity} left)</span>
      </div>
    </div>
  );
}
