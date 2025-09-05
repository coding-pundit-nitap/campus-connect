import { ShoppingCart } from "lucide-react";

export default function CheckoutHeader() {
  return (
    <div className="mb-8 p-4 border border-gray-500 rounded-lg">
      <ShoppingCart className="h-10 w-10 text-green-800 animate-bounce" />
      <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
      <p className="text-muted-foreground mt-2">Complete your purchase</p>
    </div>
  );
}
