"use client";
import { useMemo } from "react";

import { useGetUserAllCart } from "@/hooks/useCart";
import cartUIService from "@/lib/cart.utils";
import { CartDrawerState } from "@/types/cart.type";

export function useCartDrawer(): CartDrawerState {
  const { data: fullCarts, isLoading, error } = useGetUserAllCart();

  const cartState = useMemo((): CartDrawerState => {
    if (isLoading) {
      return {
        isLoading: true,
        error: false,
        isEmpty: false,
        summary: null,
      };
    }

    if (error) {
      return {
        isLoading: false,
        error: true,
        isEmpty: false,
        summary: null,
      };
    }

    if (!fullCarts || fullCarts.length === 0) {
      return {
        isLoading: false,
        error: false,
        isEmpty: true,
        summary: null,
      };
    }

    const shopCarts = cartUIService.transformFullCartsToShopCarts(fullCarts);

    if (shopCarts.length === 0) {
      return {
        isLoading: false,
        error: false,
        isEmpty: true,
        summary: null,
      };
    }

    const summary = cartUIService.createCartSummary(shopCarts);

    return {
      isLoading: false,
      error: false,
      isEmpty: false,
      summary,
    };
  }, [fullCarts, isLoading, error]);

  return cartState;
}
