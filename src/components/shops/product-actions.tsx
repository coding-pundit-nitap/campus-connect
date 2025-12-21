"use client";

import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  useAddToCart,
  useIsWatchingStock,
  useToggleStockWatch,
} from "@/hooks/queries";
import { cn } from "@/lib/cn";

type ProductActionsProps = {
  productId: string;
  maxQuantity?: number;
  className?: string;
};

export default function ProductActions({
  productId,
  maxQuantity = 10,
  className,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const isOutOfStock = maxQuantity <= 0;

  const {
    mutate: upsertProduct,
    isPending: isPendingAddToCart,
    isError: isErrorAddToCart,
  } = useAddToCart();

  const { data: isWatching, isLoading: isCheckingWatch } = useIsWatchingStock(
    productId,
    isOutOfStock
  );

  const { mutate: toggleWatch, isPending: isPendingWatch } =
    useToggleStockWatch();

  const handleAddToCart = () => {
    upsertProduct(
      { product_id: productId, quantity },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        },
      }
    );
  };

  const handleToggleWatch = () => {
    toggleWatch(productId);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(Math.max(1, prev + delta), maxQuantity));
  };

  if (isOutOfStock) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-orange-600 dark:text-orange-400 font-semibold">
            Out of Stock
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Get notified when this product is back in stock
          </p>
        </div>

        <Button
          size="lg"
          variant={isWatching?.data ? "outline" : "default"}
          className={cn(
            "w-full h-14 text-base font-bold gap-2 transition-all duration-300",
            isWatching?.data && "border-primary text-primary"
          )}
          onClick={handleToggleWatch}
          disabled={isPendingWatch || isCheckingWatch}
        >
          {isPendingWatch || isCheckingWatch ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isCheckingWatch ? "Loading..." : "Updating..."}
            </>
          ) : isWatching ? (
            <>
              <BellOff className="h-5 w-5" />
              Stop Watching
            </>
          ) : (
            <>
              <Bell className="h-5 w-5" />
              Notify Me When Available
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-4">
        <span className="font-medium text-sm text-muted-foreground min-w-[70px]">
          Quantity:
        </span>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md hover:bg-background"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isPendingAddToCart}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold text-lg tabular-nums">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md hover:bg-background"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxQuantity || isPendingAddToCart}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {maxQuantity && (
          <span className="text-xs text-muted-foreground">
            Max: {maxQuantity}
          </span>
        )}
      </div>

      <Button
        size="lg"
        className={cn(
          "w-full h-14 text-base font-bold gap-2 transition-all duration-300",
          showSuccess
            ? "bg-green-600 hover:bg-green-600"
            : "bg-primary hover:bg-primary/90"
        )}
        onClick={handleAddToCart}
        disabled={isPendingAddToCart}
      >
        {isPendingAddToCart ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Adding to Cart...
          </>
        ) : showSuccess ? (
          <>
            <Check className="h-5 w-5" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </Button>

      {isErrorAddToCart && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to add to cart. Please try again.</span>
        </div>
      )}
    </div>
  );
}
