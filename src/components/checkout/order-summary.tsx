import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartItemData } from "@/types";

import { CartItemContainer } from "../cart-drawer/cart-item-container";

interface OrderSummaryProps {
  items: CartItemData[];
  onPlaceOrder: () => void;
  isProcessing: boolean;
}

export default function OrderSummary({
  items,
  onPlaceOrder,
  isProcessing,
}: OrderSummaryProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

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
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={onPlaceOrder}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing
            ? "Processing..."
            : `Place Order - ₹${total.toFixed(2)}`}
        </Button>
      </CardContent>
    </Card>
  );
}
