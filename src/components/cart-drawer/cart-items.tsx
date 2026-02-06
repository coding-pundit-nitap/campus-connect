"use client";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

import { BatchCountdownBanner } from "@/components/shops/batch/batch-countdown-banner";
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
    (acc, item) =>
      acc + ((item.price * (100 - item.discount)) / 100) * item.quantity,
    0
  );
  const handlePlaceOrder = () => {
    router.push(`/checkout/${cart_id}`);
  };

  const shopId = items[0]?.shop_id;

  return (
    <div className="flex-1 flex flex-col h-full space-y-2 p-4">
      {shopId && <BatchCountdownBanner shopId={shopId} />}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Add items to your cart to checkout
            </p>
          </div>
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
