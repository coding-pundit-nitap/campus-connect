import React from "react";

import { MOVProgress } from "@/components/cart-drawer/mov-progress";
import { Button } from "@/components/ui/button";

import { DrawerClose } from "../ui/drawer";

type Props = {
  total_price: number;
  min_order_value: number;
  onProceed: () => void;
};

export function CartFooter({ total_price, min_order_value, onProceed }: Props) {
  const isMOVMet = total_price >= min_order_value;

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
        <Button
          onClick={onProceed}
          disabled={!isMOVMet}
          className="w-full"
          size="lg"
        >
          <DrawerClose className="w-full h-full flex items-center justify-center">
            {isMOVMet
              ? "Proceed to Checkout"
              : `Add ₹${(min_order_value - total_price).toFixed(0)} more`}
          </DrawerClose>
        </Button>
      </div>
    </div>
  );
}
