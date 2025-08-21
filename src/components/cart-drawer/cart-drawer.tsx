"use client";
import React from "react";
import { useCartDrawer } from "@/hooks";
import {
  CartLoadingState,
  CartErrorState,
  CartEmptyState,
} from "./cart-states";
import CartContent from "./cart-content";

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
