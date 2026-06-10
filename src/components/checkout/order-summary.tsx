import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartItemData } from "@/types";

import { CartItemContainer } from "../cart-drawer/cart-item-container";

interface OrderSummaryProps {
  items: CartItemData[];
  itemTotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  isDirectDelivery?: boolean;
  actionButton?: React.ReactNode;
}

export default function OrderSummary({
  items,
  itemTotal,
  deliveryFee,
  platformFee,
  total,
  isDirectDelivery = false,
  actionButton,
}: OrderSummaryProps) {
  return (
    <Card className="sticky top-6 border border-border/30 bg-card/50 backdrop-blur-2xl shadow-xl shadow-blue-500/[0.01] rounded-2xl overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
          {items.map((item) => (
            <CartItemContainer key={item.id} item={item} />
          ))}
        </div>
        <div className="space-y-3">
          <Separator className="bg-border/40" />
          <div className="flex justify-between text-xs font-semibold text-muted-foreground/80">
            <span>Item Total</span>
            <span className="text-foreground">₹{itemTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-muted-foreground/80">
            <span>Delivery Fee ({isDirectDelivery ? "Direct" : "Batch"})</span>
            <span
              className={
                deliveryFee === 0
                  ? "text-emerald-500 font-bold"
                  : "text-foreground"
              }
            >
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          {platformFee > 0 && (
            <div className="flex justify-between text-xs font-semibold text-muted-foreground/80">
              <span>Platform Fee</span>
              <span className="text-foreground">₹{platformFee.toFixed(2)}</span>
            </div>
          )}
          <Separator className="bg-border/40" />
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-bold text-foreground">
              Total Amount
            </span>
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>
        {actionButton && <div className="pt-2">{actionButton}</div>}
      </CardContent>
    </Card>
  );
}
