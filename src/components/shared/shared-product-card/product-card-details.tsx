import { Package, Star } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { SerializedProduct } from "@/types/product.types";

interface ProductCardDetailsProps {
  product: SerializedProduct;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
}

export function ProductCardDetails({
  product,
  discountedPrice,
  productHasDiscount,
  productHasRating,
}: ProductCardDetailsProps) {
  const stockInfo = (() => {
    const { stock_quantity } = product;
    if (stock_quantity === 0)
      return { text: "Out of Stock", className: "text-red-600" };
    if (stock_quantity <= 5)
      return { text: "Low Stock", className: "text-orange-500 font-semibold" };
    return { text: "In Stock", className: "text-green-600" };
  })();

  const ratingClasses = (() => {
    const rating = product.rating || 0;
    if (rating >= 4.5) return "bg-green-100 text-green-800";
    if (rating >= 4.0) return "bg-sky-100 text-sky-800";
    if (rating >= 3.0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  })();

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Section for Category and Rating */}
      <div className="flex items-center justify-between text-xs">
        {product.category ? (
          <Badge variant="outline">{product.category.name}</Badge>
        ) : (
          <span /> // Placeholder to maintain alignment
        )}
        {productHasRating && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 ${ratingClasses}`}
          >
            <Star className="h-3 w-3" />
            <span className="font-bold">{product.rating!.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Section for Product Name and Description */}
      <div className="space-y-1">
        <h3 className="truncate font-semibold leading-tight text-lg">
          {product.name}
        </h3>
        {product.description && (
          <p className="min-h-[40px] text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </div>

      {/* Section for Price and Discount */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-bold text-primary">
          ₹{discountedPrice}
        </span>
        {productHasDiscount && (
          <>
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.price}
            </span>
            <Badge
              variant="destructive"
              className="border-none bg-green-500 hover:bg-green-600"
            >
              {product.discount}% OFF
            </Badge>
          </>
        )}
      </div>

      {/* Section for Stock Information */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <span className={stockInfo.className}>{stockInfo.text}</span>
        <span>({product.stock_quantity} left)</span>
      </div>
    </div>
  );
}
