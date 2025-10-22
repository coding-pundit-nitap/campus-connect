import { ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks";

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
