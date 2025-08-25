import React from "react";

import cartUIService from "@/lib/cart.utils";
import { CartSummary } from "@/types/cart.type";
import { TabItem } from "@/types/ui.types";

import { SharedTabs } from "../shared/shared-tabs";
import { CartItems } from "./cart-items";
import { CartDrawerWrapper } from "./cart-states";

interface CartContentProps {
  summary: CartSummary;
}

export default function CartContent({ summary }: CartContentProps) {
  const { totalItems, totalPrice, shopCarts } = summary;

  const tabItems: TabItem[] = shopCarts.map((cart, index) => ({
    value: index.toString(),
    label: cart.shop_name,
    content: <CartItems items={cart.items} />,
  }));

  return (
    <CartDrawerWrapper
      totalItems={totalItems}
      totalPrice={totalPrice}
      onProceed={cartUIService.handleProceedToCheckout}
    >
      <SharedTabs defaultValue="0" tabs={tabItems} />
    </CartDrawerWrapper>
  );
}
