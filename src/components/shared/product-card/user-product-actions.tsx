import { Bell, BellOff, Loader2, ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks";
import { useStockWatches, useToggleStockWatch } from "@/hooks/queries";
import { useSession } from "@/lib/auth-client";

import LoadingSpinner from "../shared-loading-spinner";

interface UserProductActionsProps {
  product_id: string;
  onAddToCart: (product_id: string, quantity: number) => void;
  onViewDetails?: (product_id: string) => void;
  isAddingToCart: boolean;
  stock: number;
}

export function UserProductActions({
  product_id,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
  stock,
}: UserProductActionsProps) {
  const isOutOfStock = stock === 0;
  const isMobile = useIsMobile();
  const session = useSession();
  const isAuthenticated = !!session.data?.user?.id;

  const { data: stockWatches, isLoading: isCheckingWatch } =
    useStockWatches(isAuthenticated);
  const { mutate: toggleWatch, isPending: isPendingWatch } =
    useToggleStockWatch();

  const handleToggleWatch = () => {
    toggleWatch(product_id);
  };

  const disableWatchButton = isPendingWatch || isCheckingWatch;
  const isWatchingProduct = !!stockWatches?.some(
    (watch) => watch.product.id === product_id
  );

  return (
    <div className="space-y-2">
      <Button
        variant={isOutOfStock ? "outline" : "default"}
        className="w-full"
        disabled={isOutOfStock || isAddingToCart}
        onClick={() => onAddToCart(product_id, 1)}
      >
        {isAddingToCart ? (
          <LoadingSpinner />
        ) : isMobile ? (
          <ShoppingCart />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        {!isMobile && (isOutOfStock ? "Out of Stock" : "Add to Cart")}
      </Button>
      {isAuthenticated && (
        <Button
          variant={isWatchingProduct ? "outline" : "secondary"}
          className="w-full"
          onClick={handleToggleWatch}
          disabled={disableWatchButton}
        >
          {disableWatchButton ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isWatchingProduct ? (
            <BellOff className="mr-2 h-4 w-4" />
          ) : (
            <Bell className="mr-2 h-4 w-4" />
          )}
          {disableWatchButton
            ? "Updating..."
            : isWatchingProduct
              ? "Remove Watchlist"
              : "Add to Watchlist"}
        </Button>
      )}
      {onViewDetails && !isMobile && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onViewDetails(product_id)}
        >
          View Details
        </Button>
      )}
    </div>
  );
}
