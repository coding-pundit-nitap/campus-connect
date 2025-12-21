"use client";

import {
  AlertCircle,
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/queries";
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

  const {
    mutate: upsertProduct,
    isPending: isPendingAddToCart,
    isError: isErrorAddToCart,
  } = useAddToCart();

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

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(Math.max(1, prev + delta), maxQuantity));
  };

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
