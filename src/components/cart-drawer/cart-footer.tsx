import React from "react";

import { Button } from "@/components/ui/button";

import { DrawerClose } from "../ui/drawer";

type Props = {
  total_price: number;
  onProceed: () => void;
};

export function CartFooter({ total_price, onProceed }: Props) {
  return (
    <div className="border-t bg-background p-4 sticky bottom-0 z-10">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-base text-muted-foreground">Subtotal</span>
          <span className="text-lg font-bold">₹{total_price.toFixed(2)}</span>
        </div>
        <Button onClick={onProceed} className="w-full" size="lg">
          <DrawerClose className="w-full h-full flex items-center justify-center">
            Proceed to Checkout
          </DrawerClose>
        </Button>
      </div>
    </div>
  );
}
