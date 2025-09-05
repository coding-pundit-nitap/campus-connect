import { Calendar, Package, Star } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { SerializedProduct } from "@/types/product.types";

interface ProductCardDetailsProps {
  product: SerializedProduct;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
  formattedDate: string;
}

export function ProductCardDetails({
  product,
  discountedPrice,
  productHasDiscount,
  productHasRating,
  formattedDate,
}: ProductCardDetailsProps) {
  const getStockColor = () => {
    if (product.stock_quantity === 0) return "text-red-600";
    if (product.stock_quantity <= 5) return "text-orange-600";
    if (product.stock_quantity <= 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockStatus = () => {
    if (product.stock_quantity === 0) return "Out of Stock";
    if (product.stock_quantity <= 5) return "Low Stock";
    if (product.stock_quantity <= 10) return "Limited Stock";
    return "In Stock";
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
      {product.description && (
        <p className="text-sm text-muted-foreground min-h-[2.5rem] leading-relaxed">
          {product.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">
            ₹{discountedPrice}
          </span>
          {productHasDiscount && (
            <span className="text-sm line-through text-muted-foreground">
              ₹{product.price.toFixed(2)}
            </span>
          )}
        </div>

        {productHasRating && (
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-700">
              {product.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className={`font-medium ${getStockColor()}`}>
            {getStockStatus()}
          </span>
          <span className="text-muted-foreground">
            ({product.stock_quantity})
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{formattedDate}</span>
        </div>
      </div>

      {productHasDiscount && (
        <div className="flex justify-start">
          <Badge
            variant="secondary"
            className="text-xs bg-green-100 text-green-700 border-green-200"
          >
            Save {product.discount}%
          </Badge>
        </div>
      )}
    </div>
  );
}
