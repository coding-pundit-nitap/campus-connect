import { ShoppingCart } from "lucide-react";

import { CheckoutStep, CheckoutStepper } from "./checkout-stepper";

interface CheckoutHeaderProps {
  currentStep?: CheckoutStep;
}

export default function CheckoutHeader({
  currentStep = "address",
}: CheckoutHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
        <ShoppingCart className="h-10 w-10 text-primary animate-bounce" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Checkout
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete your purchase
          </p>
        </div>
      </div>
      <CheckoutStepper currentStep={currentStep} />
    </div>
  );
}
