import { ShoppingCart } from "lucide-react";

import { CheckoutStep, CheckoutStepper } from "./checkout-stepper";

interface CheckoutHeaderProps {
  currentStep?: CheckoutStep;
}

export default function CheckoutHeader({
  currentStep = "address",
}: CheckoutHeaderProps) {
  return (
    <div className="space-y-6 bg-card/30 backdrop-blur-xl border border-border/30 rounded-2xl p-6 shadow-xl shadow-primary/[0.01]">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-tr from-blue-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <ShoppingCart className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-foreground">
            Secure Checkout
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
            Confirm details and complete your university purchase
          </p>
        </div>
      </div>
      <CheckoutStepper currentStep={currentStep} />
    </div>
  );
}
