import React from "react";

import SharedDrawer from "@/components/shared/shared-drawer";

import { CartIcon } from "./cart-icon";

interface CartDrawerWrapperProps {
  children: React.ReactNode;
  totalItems?: number;
}

export function CartDrawerWrapper({
  children,
  totalItems = 0,
}: CartDrawerWrapperProps) {
  return (
    <SharedDrawer
      direction="right"
      icon={<CartIcon totalItems={totalItems} />}
      title="Your Cart"
      description={totalItems > 0 ? `${totalItems} items` : "0 items"}
    >
      {children}
    </SharedDrawer>
  );
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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Your cart is empty</p>
      </div>
    </CartDrawerWrapper>
  );
}
