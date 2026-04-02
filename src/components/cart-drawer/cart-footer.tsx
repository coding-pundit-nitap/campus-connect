import React from "react";

import { MOVProgress } from "@/components/cart-drawer/mov-progress";
import { Button } from "@/components/ui/button";

import { DrawerClose } from "../ui/drawer";

type Props = {
  total_price: number;
  min_order_value: number;
  shop_accepting_orders: boolean;
  onProceed: () => void;
};

export function CartFooter({
  total_price,
  min_order_value,
  shop_accepting_orders,
  onProceed,
}: Props) {
  const isMOVMet = total_price >= min_order_value;
  const canProceed = isMOVMet && shop_accepting_orders;

  return (
    <div className="border-t bg-background p-4 sticky bottom-0 z-10">
      <div className="space-y-4">
        <MOVProgress
          currentTotal={total_price}
          minOrderValue={min_order_value}
        />
        <div className="flex justify-between items-center">
          <span className="text-base text-muted-foreground">Subtotal</span>
          <span className="text-lg font-bold">₹{total_price.toFixed(2)}</span>
        </div>
        {canProceed ? (
          <DrawerClose asChild>
            <Button onClick={onProceed} className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </DrawerClose>
        ) : (
          <Button disabled className="w-full" size="lg">
            {!shop_accepting_orders
              ? "Shop is not accepting orders"
              : `Add ₹${(min_order_value - total_price).toFixed(0)} more`}
          </Button>
        )}
        {!shop_accepting_orders && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Orders are currently paused for this shop.
          </p>
        )}
      </div>
    </div>
  );
}
