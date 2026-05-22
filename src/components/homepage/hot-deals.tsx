"use client";

import { Flame } from "lucide-react";
import React from "react";

import { UserProductCard } from "@/components/shared/product-card";
import { useProductActions } from "@/hooks/common/useProductActions";
import { useProductDeals } from "@/hooks/queries/useProductDeals";

export default function HotDeals() {
  const { data: deals = [], isLoading, isError } = useProductDeals(10);
  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  if (!isLoading && (isError || deals.length === 0)) {
    return null;
  }

  return (
    <div className="w-full mb-8 relative">
      <div className="flex items-center gap-2 mb-4 px-4 md:px-1">
        <div className="bg-red-500/10 dark:bg-red-500/20 text-red-500 p-2 rounded-full animate-pulse">
          <Flame className="h-5 w-5 fill-current" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
            Hot Deals
            <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
              Save Big
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Top discounts curated just for you
          </p>
        </div>
      </div>

      <div className="w-full flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-2 px-4 md:px-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="w-[280px] md:w-[320px] h-[340px] rounded-lg bg-muted/65 animate-pulse shrink-0 snap-start"
              />
            ))
          : deals.map((product, index) => (
              <div
                key={product.id}
                className="w-[280px] md:w-[320px] shrink-0 snap-start hover:scale-[1.01] transition-transform duration-300 flex flex-col"
              >
                <UserProductCard
                  product={product}
                  index={index}
                  onAddToCart={onAddToCart || (() => {})}
                  onViewDetails={onViewDetails || (() => {})}
                  isAddingToCart={isAddingToCart || false}
                />
              </div>
            ))}
      </div>
    </div>
  );
}
