"use client";

import Link from "next/link";
import React from "react";

import { CardFooter } from "@/components/ui/card";
import { SerializedProduct } from "@/types/product.types";

import { ProductCardBadges } from "./product-card-badges";
import { ProductCardProvider } from "./product-card-context";
import { ProductCardDetails } from "./product-card-details";
import { ProductCardImage } from "./product-card-header";
import { ProductWatchlistButton } from "./product-watchlist-button";
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
      <div className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(37,99,235,0.12)] transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,0.25)] hover:border-primary/45 flex flex-col h-full">
        <Link
          href={`/product/${product.id}`}
          className="flex md:hidden min-h-[144px] h-auto"
        >
          <div className="relative w-28 shrink-0 overflow-hidden bg-muted">
            <ProductCardImage variant="compact" />
            <ProductCardBadges variant="compact" />
            <div className="absolute top-2 right-2 z-10">
              <ProductWatchlistButton product={product} variant="compact" />
            </div>
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <ProductCardDetails variant="compact" />
            <div
              className="p-2 pt-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <UserProductActions
                onAddToCart={onAddToCart}
                isAddingToCart={isAddingToCart}
              />
            </div>
          </div>
        </Link>

        <div className="hidden md:block">
          <div className="relative">
            <ProductCardImage />
            <ProductCardBadges />
            <div className="absolute top-3 right-3 z-10">
              <ProductWatchlistButton product={product} />
            </div>
          </div>

          <ProductCardDetails />

          <CardFooter className="p-4 pt-0">
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
