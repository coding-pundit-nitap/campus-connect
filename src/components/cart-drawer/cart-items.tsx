import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

import { CartItemData } from "@/types";

import { CartFooter } from "./cart-footer";
import { CartItemContainer } from "./cart-item-container";

interface CartItemsProps {
  items: CartItemData[];
  cart_id: string;
}

export function CartItems({ items, cart_id }: CartItemsProps) {
  const router = useRouter();
  const total_price = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const handlePlaceOrder = () => {
    router.push(`/checkout/${cart_id}`);
  };
  return (
    <div className="flex-1 flex flex-col h-full space-y-2 p-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CartItemContainer key={item.id} item={item} />
          ))}
        </div>
      )}
      <CartFooter total_price={total_price} onProceed={handlePlaceOrder} />
    </div>
  );
}
