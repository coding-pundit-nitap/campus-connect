"use client";

import { ChevronLeft, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import CategoryPills from "@/components/homepage/category-pills";
import { ShopProductList } from "@/components/shops/shop-product-list";
import { Button } from "@/components/ui/button";
import { useInfiniteProducts } from "@/hooks/queries/useInfiniteProducts";

export default function DealsPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const {
    allProducts: displayProducts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isAddingToCart,
    onAddToCart,
    onViewDetails,
  } = useInfiniteProducts({
    initialProducts: [],
    initialHasNextPage: false,
    initialNextCursor: null,
    limit: 20,
    categoryId: selectedCategoryId || undefined,
    hasDiscount: true,
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Premium Flame Header Banner */}
      <div className="relative w-full border-b border-muted/80 bg-gradient-to-br from-red-500/10 via-background to-orange-500/5 py-8 px-4 md:px-8 mb-6 shadow-sm overflow-hidden group">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-red-500/15 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-orange-500/15 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Link href="/">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                <Flame className="w-3.5 h-3.5 fill-red-500/10" />
                <span>Special Offers</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight mt-1 flex items-center gap-2.5">
              <span>NIT AP Hot Deals</span>
              <span className="text-2xl animate-pulse">⚡</span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed font-medium">
              Satisfy your cravings and stock up on campus essentials with top
              discounts curated just for you.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-4 py-3 rounded-xl bg-card/45 backdrop-blur-sm border border-muted/80 shadow-xs">
            <div className="bg-amber-500/10 text-amber-500 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">
                Flash Discounts
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Updated in real-time
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pb-12">
        <div id="deals-category-pills-section" className="mb-4">
          <CategoryPills
            selectedId={selectedCategoryId}
            onChange={setSelectedCategoryId}
          />
        </div>

        <div id="deals-products-list-section" className="mt-2">
          <ShopProductList
            displayProducts={displayProducts}
            isLoading={isLoading}
            fetchNextPage={fetchNextPage}
            error={error}
            hasNextPage={hasNextPage}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            isAddingToCart={isAddingToCart}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    </div>
  );
}
