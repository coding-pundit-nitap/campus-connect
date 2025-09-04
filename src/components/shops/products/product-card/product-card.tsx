import { Product } from "@prisma/client";
import React from "react";

import { SharedCard } from "@/components/shared/shared-card";
import { Badge } from "@/components/ui/badge";

import { ProductCardActions } from "./product-card-actions";
import { ProductCardDetails } from "./product-card-details";
import { ProductCardHeader } from "./product-card-header";

interface ProductCardProps {
  product: Product;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
  formattedDate: string;
  priority?: boolean;
}

export function ProductCard({
  product,
  discountedPrice,
  productHasDiscount,
  productHasRating,
  formattedDate,
  priority = false,
}: ProductCardProps) {
  const isOutOfStock = product.stock_quantity === 0;
  const hasLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="relative">
      <SharedCard
        className="group hover:shadow-xl overflow-hidden border-0 shadow-lg"
        headerClassName="p-0 relative"
        showFooter={true}
        headerContent={
          <div className="relative">
            <ProductCardHeader product={product} priority={priority} />
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {productHasDiscount && (
                <Badge
                  variant="destructive"
                  className="text-xs font-bold shadow-md"
                >
                  -
                  {Math.round(
                    ((product.price.toNumber() - parseFloat(discountedPrice)) /
                      product.price.toNumber()) *
                      100
                  )}
                  % OFF
                </Badge>
              )}
              {isOutOfStock && (
                <Badge
                  variant="outline"
                  className="bg-white/90 text-red-600 border-red-200 text-xs font-medium"
                >
                  Out of Stock
                </Badge>
              )}
              {hasLowStock && !isOutOfStock && (
                <Badge
                  variant="outline"
                  className="bg-white/90 text-orange-600 border-orange-200 text-xs font-medium"
                >
                  Low Stock
                </Badge>
              )}
            </div>
            {productHasRating && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="default"
                  className="bg-white/90 text-gray-800 border-gray-200 text-xs font-medium shadow-md"
                >
                  ⭐ {product.rating!.toFixed(1)}
                </Badge>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                <div className="bg-white/95 px-3 py-1 rounded-full border">
                  <span className="text-sm font-medium text-gray-700">
                    Out of Stock
                  </span>
                </div>
              </div>
            )}
          </div>
        }
        footerContent={<ProductCardActions product={product} />}
      >
        <ProductCardDetails
          product={product}
          discountedPrice={discountedPrice}
          productHasDiscount={productHasDiscount}
          productHasRating={productHasRating}
          formattedDate={formattedDate}
        />
      </SharedCard>
    </div>
  );
}
