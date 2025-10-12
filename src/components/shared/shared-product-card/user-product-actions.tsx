import { ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

import LoadingSpinner from "../shared-loading-spinner";

interface UserProductActionsProps {
  product_id: string;
  onAddToCart: (product_id: string, quantity: number) => void;
  onViewDetails?: (product_id: string, shop_id: string) => void;
  isAddingToCart: boolean;
  stock: number;
  shop_id: string;
}

export function UserProductActions({
  product_id,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
  stock,
  shop_id,
}: UserProductActionsProps) {
  const isOutOfStock = stock === 0;

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
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
      {onViewDetails && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onViewDetails(product_id, shop_id)}
        >
          View Details
        </Button>
      )}
    </div>
  );
}
