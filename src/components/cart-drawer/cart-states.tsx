import { ShoppingCart } from "lucide-react";
import React from "react";

import { SheetClose } from "@/components/ui/sheet";

import { Button } from "../ui/button";

interface CartDrawerWrapperProps {
  children: React.ReactNode;
}

export function CartDrawerWrapper({
  children,
}: Pick<CartDrawerWrapperProps, "children">) {
  return <div className="flex w-full h-full flex-col">{children}</div>;
}

export function CartLoadingState() {
  return (
    <CartDrawerWrapper>
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    </CartDrawerWrapper>
  );
}

export function CartErrorState() {
  return (
    <CartDrawerWrapper>
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">
          Failed to load cart. Please try again.
        </p>
      </div>
    </CartDrawerWrapper>
  );
}

export function CartEmptyState() {
  return (
    <CartDrawerWrapper>
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">
            Add items to your cart to checkout
          </p>
        </div>
        <SheetClose asChild>
          <Button variant="outline" size="sm" className="mt-4">
            Start Shopping
          </Button>
        </SheetClose>
      </div>
    </CartDrawerWrapper>
  );
}
