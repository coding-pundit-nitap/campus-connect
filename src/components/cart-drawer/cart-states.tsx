import { ShoppingCart } from "lucide-react";
import React from "react";

import { SheetClose } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="space-y-4 p-4 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4 py-3">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full rounded-xl" />
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
