import React from "react";

import { Button } from "../ui/button";

type Props = {
  total_price: number;
  onProceed: () => void;
};

export function CartFooter({ total_price, onProceed }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-bold">₹{total_price.toFixed(2)}</span>
      </div>
      <Button className="w-full" size="lg" onClick={onProceed}>
        Proceed to Checkout
      </Button>
    </div>
  );
}
