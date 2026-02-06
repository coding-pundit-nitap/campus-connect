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
}

export default function OrderSummary({
  items,
  itemTotal,
  deliveryFee,
  platformFee,
  total,
}: OrderSummaryProps) {
  return (
    <Card className="sticky py-4 top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {items.map((item) => (
            <CartItemContainer key={item.id} item={item} />
          ))}
        </div>
        <div className="space-y-2">
          <Separator />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Item Total</span>
            <span>₹{itemTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee.toFixed(2)}</span>
          </div>
          {platformFee > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Platform Fee</span>
              <span>₹{platformFee.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
