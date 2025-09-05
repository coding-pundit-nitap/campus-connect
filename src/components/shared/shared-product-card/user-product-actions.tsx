import { Eye, ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { SerializedProduct } from "@/types/product.types";

import LoadingSpinner from "../shared-loading-spinner";

interface UserProductActionsProps {
  product: SerializedProduct;
  onAddToCart: (product_id: string, quantity: number) => void;
  onViewDetails: (product_id: string) => void;
  isAddingToCart: boolean;
}

export function UserProductActions({
  product,
  onAddToCart,
  onViewDetails,
  isAddingToCart,
}: UserProductActionsProps) {
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className="p-4 pt-0 space-y-2">
      <Button
        variant={isOutOfStock ? "outline" : "default"}
        className="w-full transition-all hover:scale-105 duration-200 hover:shadow-md"
        disabled={isOutOfStock || isAddingToCart}
        onClick={() => onAddToCart(product.id, 1)}
      >
        {isAddingToCart ? (
          <LoadingSpinner />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )}
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="transition-all w-full hover:scale-105 duration-200 hover:shadow-sm"
        onClick={() => onViewDetails(product.id)}
      >
        <Eye className="w-3 h-3 mr-1" />
        View Details
      </Button>
    </div>
  );
}
