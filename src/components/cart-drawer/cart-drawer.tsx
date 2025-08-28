"use client";
import React from "react";

import { useCartDrawer } from "@/hooks";

import CartContent from "./cart-content";
import {
  CartEmptyState,
  CartErrorState,
  CartLoadingState,
} from "./cart-states";

export function CartDrawer() {
  const cartState = useCartDrawer();
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
}
