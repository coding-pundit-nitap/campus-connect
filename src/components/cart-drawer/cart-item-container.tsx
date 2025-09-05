"use client";
import { useUpsertCartItem } from "@/hooks";
import { cartUIService } from "@/lib/utils-functions";
import { CartItemData } from "@/types/cart.types";

import { CartItem } from "./cart-item";

interface CartItemContainerProps {
  item: CartItemData;
}

export function CartItemContainer({ item }: CartItemContainerProps) {
  const { mutate: updateQuantity, isPending: isUpsertingQuantity } =
    useUpsertCartItem();

  const onRemove = () =>
    cartUIService.updateItemQuantity(item.product_id, 0, updateQuantity);
  const onIncrease = () =>
    cartUIService.increaseItemQuantity(
      item.product_id,
      item.quantity,
      updateQuantity
    );
  const onDecrease = () =>
    cartUIService.decreaseItemQuantity(
      item.product_id,
      item.quantity,
      updateQuantity
    );

  return (
    <CartItem
      item={item}
      isUpsertingQuantity={isUpsertingQuantity}
      onRemove={onRemove}
      onIncrease={onIncrease}
      onDecrease={onDecrease}
    />
  );
}
