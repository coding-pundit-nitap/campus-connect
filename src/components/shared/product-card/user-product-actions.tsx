import { ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/cn";

import LoadingSpinner from "../shared-loading-spinner";
import { useProductCard } from "./product-card-context";

interface UserProductActionsProps {
  onAddToCart: (product_id: string, quantity: number) => void;
  onViewDetails?: (product_id: string) => void;
  isAddingToCart: boolean;
}

export function UserProductActions({
  onAddToCart,
  onViewDetails,
  isAddingToCart,
}: UserProductActionsProps) {
  const { product, isOutOfStock } = useProductCard();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        variant={isOutOfStock ? "outline" : "default"}
        className={cn(
          "w-full font-bold transition-all duration-300 cursor-pointer rounded-lg relative overflow-hidden group/btn",
          !isOutOfStock &&
            "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 border-none"
        )}
        disabled={isOutOfStock || isAddingToCart}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddToCart(product.id, 1);
        }}
      >
        {isAddingToCart ? (
          <LoadingSpinner />
        ) : (
          <ShoppingCart className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        )}
        <span className="text-sm font-semibold ml-2">
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </span>
      </Button>

      {onViewDetails && !isMobile && (
        <Button
          variant="secondary"
          className="w-full text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewDetails(product.id);
          }}
        >
          View Details
        </Button>
      )}
    </div>
  );
}
