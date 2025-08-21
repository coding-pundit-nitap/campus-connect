import React from "react";
import { SharedTabs } from "../shared/shared-tabs";
import { TabItem } from "@/types/ui";
import { CartSummary } from "@/types/cart.type";
import { CartDrawerWrapper } from "./cart-states";
import { CartItems } from "./cart-items";
import cartUIService from "@/lib/cart.utils";

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
