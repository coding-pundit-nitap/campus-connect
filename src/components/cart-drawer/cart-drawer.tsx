"use client";
import { ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartDrawer } from "@/hooks";

import CartContent from "./cart-content";
import { CartIcon } from "./cart-icon";
import {
  CartEmptyState,
  CartErrorState,
  CartLoadingState,
} from "./cart-states";

export function CartDrawer() {
  const cartState = useCartDrawer();

  const renderContent = () => {
    if (cartState.isLoading) {
      return <CartLoadingState />;
    }

    if (cartState.error) {
      return <CartErrorState />;
    }

    if (cartState.isEmpty || !cartState.summary) {
      return <CartEmptyState />;
    }

    return <CartContent summary={cartState.summary} />;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CartIcon totalItems={cartState.summary?.totalItems || 0} />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}
