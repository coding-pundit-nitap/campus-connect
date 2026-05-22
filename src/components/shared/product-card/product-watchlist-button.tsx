"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useStockWatches, useToggleStockWatch } from "@/hooks/queries";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { SerializedProduct } from "@/types/product.types";

interface ProductWatchlistButtonProps {
  product: SerializedProduct;
  variant?: "default" | "compact";
}

export function ProductWatchlistButton({
  product,
  variant = "default",
}: ProductWatchlistButtonProps) {
  const session = useSession();
  const isAuthenticated = !!session.data?.user?.id;

  const { data: stockWatches, isLoading: isCheckingWatch } =
    useStockWatches(isAuthenticated);
  const { mutate: toggleWatch, isPending: isPendingWatch } =
    useToggleStockWatch();

  if (!isAuthenticated) {
    return null;
  }

  const handleToggleWatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatch(product.id);
  };

  const disableWatchButton = isPendingWatch || isCheckingWatch;
  const isWatchingProduct = !!stockWatches?.some(
    (watch) => watch.product.id === product.id
  );

  const sizeClass = variant === "compact" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={handleToggleWatch}
      disabled={disableWatchButton}
      className={cn(
        "rounded-full bg-background/80 hover:bg-background backdrop-blur-md shadow-sm border border-muted/50 transition-all duration-300 active:scale-90 z-20 cursor-pointer",
        sizeClass,
        isWatchingProduct &&
          "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
      )}
      aria-label={
        isWatchingProduct ? "Remove from watchlist" : "Add to watchlist"
      }
      title={isWatchingProduct ? "Remove from watchlist" : "Add to watchlist"}
    >
      {disableWatchButton ? (
        <Loader2 className={cn("animate-spin", iconSize)} />
      ) : isWatchingProduct ? (
        <BellOff className={cn(iconSize)} />
      ) : (
        <Bell className={cn(iconSize)} />
      )}
    </Button>
  );
}
