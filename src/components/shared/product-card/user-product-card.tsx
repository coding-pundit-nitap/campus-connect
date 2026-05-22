"use client";

import Link from "next/link";
import React from "react";

import { CardFooter } from "@/components/ui/card";
import { SerializedProduct } from "@/types/product.types";

import { ProductCardBadges } from "./product-card-badges";
import { ProductCardProvider } from "./product-card-context";
import { ProductCardDetails } from "./product-card-details";
import { ProductCardImage } from "./product-card-header";
import { UserProductActions } from "./user-product-actions";

interface UserProductCardProps {
  product: SerializedProduct;
  index: number;
  onAddToCart: (product_id: string, quantity: number) => void;
  onViewDetails: (product_id: string) => void;
  isAddingToCart: boolean;
}

export function UserProductCard({
  product,
  index,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
}: UserProductCardProps) {
  return (
    <ProductCardProvider product={product} priority={index < 4}>
      <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-xl">
        {/* Mobile layout */}
        <Link href={`/product/${product.id}`} className="flex md:hidden h-36">
          <div className="relative w-24 shrink-0 h-full">
            <ProductCardImage variant="compact" />
            <ProductCardBadges variant="compact" />
          </div>
          <div className="flex md:flex-col h-full justify-between flex-1">
            <ProductCardDetails variant="compact" />
            <div className="p-2">
              <UserProductActions
                onAddToCart={onAddToCart}
                isAddingToCart={isAddingToCart}
              />
            </div>
          </div>
        </Link>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="relative">
            <ProductCardImage />
            <ProductCardBadges />
          </div>

          <ProductCardDetails />

          <CardFooter className="p-4 pt-2 md:absolute md:bottom-0 md:left-0 md:w-full md:translate-y-full md:transform-gpu md:bg-linear-to-t md:from-white md:via-white/90 md:to-transparent md:p-4 md:pt-12 md:transition-transform md:duration-300 md:ease-in-out md:group-hover:translate-y-0 dark:md:from-black flex items-center justify-center dark:md:via-black/90">
            <UserProductActions
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              isAddingToCart={isAddingToCart}
            />
          </CardFooter>
        </div>
      </div>
    </ProductCardProvider>
  );
}
