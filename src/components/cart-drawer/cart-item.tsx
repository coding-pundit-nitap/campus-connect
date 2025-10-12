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
    <div className="flex flex-col md:flex-row items-center space-x-3 p-3 border rounded-lg">
      <Image
        src={item.image_url || "/placeholders/placeholder.png"}
        alt={item.name}
        width={48}
        height={48}
        className="h-12 w-12 rounded-md object-cover"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{item.name}</h4>
        {item.shop_name && (
          <p className="text-xs text-muted-foreground">{item.shop_name}</p>
        )}
        <p className="text-sm font-semibold">
          ₹{(item.price - (item.discount * item.price) / 100).toFixed(2)}
        </p>
      </div>
      <div className="flex flex-col-reverse md:flex-col items-center space-y-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 mb-0 md:mb-2"
          onClick={onRemove}
          disabled={isUpsertingQuantity || isUpsertingQuantity}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        <SharedQuantityControl
          quantity={item.quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          isLoading={isUpsertingQuantity}
        />
      </div>
    </div>
  );
}
