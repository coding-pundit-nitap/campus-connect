import { Eye, ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { SerializedProduct } from "@/lib/utils-functions/product.utils";

interface UserProductActionsProps {
  product: SerializedProduct;
}

export function UserProductActions({ product }: UserProductActionsProps) {
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className="p-4 pt-0 space-y-2">
      <Button
        variant={isOutOfStock ? "outline" : "default"}
        className="w-full transition-all hover:scale-105 duration-200 hover:shadow-md"
        disabled={isOutOfStock}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="transition-all w-full hover:scale-105 duration-200 hover:shadow-sm"
      >
        <Eye className="w-3 h-3 mr-1" />
        View Details
      </Button>
    </div>
  );
}
