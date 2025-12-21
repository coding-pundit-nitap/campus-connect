import React from "react";

import { SharedTabs } from "@/components/shared/shared-tabs";
import { CartSummary, TabItem } from "@/types";

import { CartItems } from "./cart-items";
import { CartDrawerWrapper } from "./cart-states";
interface CartContentProps {
  summary: CartSummary;
}

export default function CartContent({ summary }: CartContentProps) {
  const { shopCarts } = summary;

  const tabItems: TabItem[] = shopCarts.map((cart, index) => ({
    value: index.toString(),
    label: cart.shop_name,
    content: <CartItems cart_id={cart.id} items={cart.items} />,
  }));

  return (
    <CartDrawerWrapper>
      <SharedTabs defaultValue="0" tabs={tabItems} />
    </CartDrawerWrapper>
  );
}
