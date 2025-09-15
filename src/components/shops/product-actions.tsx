"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";

import SharedQuantityControl from "@/components/shared/shared-quantity-control";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/tanstack";

type ProductActionsProps = {
  productId: string;
  className?: string;
};

export default function ProductActions({
  productId,
  className = "",
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const {
    mutate: upsertProduct,
    isPending: isPendingAddToCart,
    isError: isErrorAddToCart,
  } = useAddToCart();

  const handleAddToCart = () => {
    upsertProduct({ product_id: productId, quantity });
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quantity Control */}
      <div className="flex items-center gap-4">
        <span className="font-medium text-sm text-muted-foreground">
          Quantity:
        </span>
        <SharedQuantityControl
          quantity={quantity}
          isLoading={isPendingAddToCart}
          onDecrease={() => handleQuantityChange(quantity - 1)}
          onIncrease={() => handleQuantityChange(quantity + 1)}
        />
      </div>
      {/* Action Buttons */}
      <div className="flex pt-4 gap-5 w-full">
        <Button
          size="lg"
          className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-bold h-14 text-base"
          onClick={handleAddToCart}
          disabled={isPendingAddToCart}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {isPendingAddToCart ? "ADDING..." : "ADD TO CART"}
        </Button>
      </div>

      {isErrorAddToCart && (
        <p className="text-red-500 text-sm">
          Failed to add to cart. Please try again.
        </p>
      )}
    </div>
  );
}
