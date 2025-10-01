import { ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

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

  return (
    <div className="p-4 pt-0 space-y-2">
      <Button
        variant={isOutOfStock ? "outline" : "default"}
        className="w-full transition-all hover:scale-105 duration-200 hover:shadow-md"
        disabled={isOutOfStock || isAddingToCart}
        onClick={() => onAddToCart(product_id, 1)}
      >
        {isAddingToCart ? (
          <LoadingSpinner />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )}
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
      {onViewDetails && (
        <Button
          variant="outline"
          className="w-full transition-all hover:scale-105 duration-200 hover:shadow-md"
          onClick={() => onViewDetails(product_id)}
        >
          View Details
        </Button>
      )}
    </div>
  );
}
