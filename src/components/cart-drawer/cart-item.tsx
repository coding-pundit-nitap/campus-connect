import { Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";

import SharedQuantityControl from "@/components/shared/shared-quantity-control";
import { Button } from "@/components/ui/button";
import { CartItemData } from "@/types";

interface CartItemProps {
  item: CartItemData;
  onRemove: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isUpsertingQuantity: boolean;
}

export function CartItem({
  item,
  onRemove,
  onIncrease,
  onDecrease,
  isUpsertingQuantity,
}: CartItemProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="relative aspect-square h-16 w-16 min-w-16 overflow-hidden rounded-md border bg-muted">
        <Image
          src={item.image_url || "/placeholders/placeholder.png"}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h4 className="text-sm font-medium leading-none line-clamp-2">
          {item.name}
        </h4>
        {item.shop_name && (
          <p className="text-xs text-muted-foreground">{item.shop_name}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-semibold">
            ₹{(item.price - (item.discount * item.price) / 100).toFixed(2)}
          </p>
          {item.discount > 0 && (
            <p className="text-xs text-muted-foreground line-through">
              ₹{item.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={isUpsertingQuantity}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
        <SharedQuantityControl
          quantity={item.quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          isLoading={isUpsertingQuantity}
          size="sm"
        />
      </div>
    </div>
  );
}
