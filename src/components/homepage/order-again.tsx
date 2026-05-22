"use client";

import { useQuery } from "@tanstack/react-query";
import { History, RotateCcw, Sparkles } from "lucide-react";
import React, { useMemo } from "react";

import { UserProductCard } from "@/components/shared/product-card";
import { useProductActions } from "@/hooks/common/useProductActions";
import { useSession } from "@/lib/auth-client";
import { orderAPIService } from "@/services/order/order-api.service";
import { SerializedProduct } from "@/types/product.types";

interface Props {
  displayProducts: SerializedProduct[];
}

export default function OrderAgain({ displayProducts }: Props) {
  const { data: session } = useSession();
  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  // Safe lightweight fetch of the most recent 5 orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", "recent", { limit: 5 }],
    queryFn: () => orderAPIService.fetchUserOrders({ limit: 5 }),
    enabled: !!session?.user,
  });

  const orders = ordersData?.data || [];

  // Extract, deduplicate, and validate active products from recent orders
  const recentOrderedProducts = useMemo(() => {
    if (!session?.user || orders.length === 0) return [];

    const productMap = new Map<string, SerializedProduct>();

    // Scan from most recent to oldest order
    for (const order of orders) {
      if (!order.items) continue;
      for (const item of order.items) {
        if (item.product && item.product.id) {
          const product = item.product;

          // Prevent showing deleted or out-of-stock products
          const isDeleted = !!product.deleted_at;
          const isOutOfStock = product.stock_quantity === 0;

          if (!productMap.has(product.id) && !isDeleted && !isOutOfStock) {
            productMap.set(product.id, product);
          }
        }
      }
    }

    return Array.from(productMap.values()).slice(0, 8);
  }, [orders, session]);

  const isHistoryEmpty = recentOrderedProducts.length === 0;
  const isGuest = !session?.user;

  // Derive standard homepage feed products as zero-cost trending fallback (max 8)
  const fallbackProducts = useMemo(() => {
    return displayProducts.slice(0, 8);
  }, [displayProducts]);

  // Loading skeleton during active session orders lookup
  if (isLoading && session?.user) {
    return (
      <div className="w-full mb-8 relative px-4 md:px-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary/10 text-primary p-2 rounded-full animate-pulse">
            <History className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-32 bg-muted rounded-md animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
        <div className="w-full flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-[280px] md:w-[320px] h-[140px] md:h-[180px] rounded-lg bg-muted/65 animate-pulse shrink-0 snap-start"
            />
          ))}
        </div>
      </div>
    );
  }

  // Active returning user with order history
  if (!isGuest && !isHistoryEmpty) {
    return (
      <div className="w-full mb-8 relative">
        <div className="flex items-center gap-2 mb-4 px-4 md:px-1">
          <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 p-2 rounded-full">
            <RotateCcw className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              Order Again
              <span className="text-xs bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recent
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Fast checkout for your campus favorites
            </p>
          </div>
        </div>

        <div className="w-full flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-2 px-4 md:px-1">
          {recentOrderedProducts.map((product, index) => (
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

  // Fallback state: Guest or No past order history (renders popular Picks at zero extra fetch cost)
  if (fallbackProducts.length === 0) return null;

  return (
    <div className="w-full mb-8 relative">
      <div className="flex items-center gap-2 mb-4 px-4 md:px-1">
        <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 p-2 rounded-full">
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
            Trending Picks
            <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Top products ordered on campus today
          </p>
        </div>
      </div>

      <div className="w-full flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-2 px-4 md:px-1">
        {fallbackProducts.map((product, index) => (
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
