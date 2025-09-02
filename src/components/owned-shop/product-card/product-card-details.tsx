import { Product } from "@prisma/client";
import React from "react";

interface ProductCardDetailsProps {
  product: Product;
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
  return (
    <div className="py-4">
      <h3 className="font-semibold mt text-lg line-clamp-2 mb-2 min-h-[3.5rem]">
        {product.name}
      </h3>

      {product.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.description}
        </p>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            ₹{discountedPrice}
          </span>
          {productHasDiscount && (
            <span className="text-sm line-through text-muted-foreground">
              ₹{product.price.toFixed(2)}
            </span>
          )}
        </div>

        {productHasRating && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {product.rating!.toFixed(1)}
            </span>
            <span className="text-yellow-500 text-sm">★</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Stock: {product.stock_quantity}</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
