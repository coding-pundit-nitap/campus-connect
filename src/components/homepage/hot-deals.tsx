"use client";

import { Flame } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import React from "react";

import { UserProductCard } from "@/components/shared/product-card";
import { useProductActions } from "@/hooks/common/useProductActions";
import { useProductDeals } from "@/hooks/queries/useProductDeals";
import { SerializedProduct } from "@/types/product.types";

function HotDealsSkeleton() {
  return (
    <div className="w-full mb-8 relative px-4 md:px-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-24 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="w-full flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="w-[280px] md:w-[320px] h-[340px] rounded-lg bg-muted/65 animate-pulse shrink-0 snap-start"
          />
        ))}
      </div>
    </div>
  );
}

interface HotDealsFeedProps {
  deals: SerializedProduct[];
  onAddToCart: (productId: string, quantity: number) => void;
  onViewDetails: (productId: string) => void;
  isAddingToCart: boolean;
}

function HotDealsFeed({
  deals,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
}: HotDealsFeedProps) {
  return (
    <div className="w-full mb-8 relative animate-fade-in">
      <div className="flex items-center justify-between mb-4 px-4 md:px-1">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-red-500 to-orange-500 text-white p-2 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.35)] animate-pulse">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-heading font-black tracking-tight text-foreground flex items-center gap-1.5">
              Hot Deals
              <span className="text-[10px] bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-bounce shadow-xs">
                Save Big
              </span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans font-medium">
              Top discounts curated just for you
            </p>
          </div>
        </div>

        <Link
          href={"/deals" as Route}
          className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 active:scale-95 shadow-xs cursor-pointer"
        >
          View All ⚡
        </Link>
      </div>

      <div className="w-full flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory gap-5 py-2 px-4 md:px-1">
        {deals.map((product, index) => (
          <div
            key={product.id}
            className="w-[280px] md:w-[320px] shrink-0 snap-start hover:scale-[1.01] transition-transform duration-300 flex flex-col"
          >
            <UserProductCard
              product={product}
              index={index}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              isAddingToCart={isAddingToCart}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HotDeals() {
  const { data: deals = [], isLoading, isError } = useProductDeals(10);
  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  if (isLoading) {
    return <HotDealsSkeleton />;
  }

  if (isError || deals.length === 0) {
    return null;
  }

  return (
    <HotDealsFeed
      deals={deals}
      onAddToCart={onAddToCart || (() => {})}
      onViewDetails={onViewDetails || (() => {})}
      isAddingToCart={isAddingToCart || false}
    />
  );
}
