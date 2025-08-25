import { ShoppingCart } from "lucide-react";

import { CartItemData } from "@/types/cart.type";

import { CartItem } from "./cart-item";

interface CartItemsProps {
  items: CartItemData[];
}

export function CartItems({ items }: CartItemsProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
