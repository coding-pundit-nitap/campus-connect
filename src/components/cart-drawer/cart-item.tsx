import { Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";

import { CartItemData } from "@/types/cart.type";

import SharedQuantityControl from "../shared/shared-quantity-control";
import { Button } from "../ui/button";

interface CartItemProps {
  item: CartItemData;
  onRemove: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function CartItem({
  item,
  onRemove,
  onIncrease,
  onDecrease,
}: CartItemProps) {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <Image
        src={item.image_url || "/placeholder.svg"}
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
        <p className="text-sm font-semibold">₹{item.price.toFixed(2)}</p>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        <SharedQuantityControl
          quantity={item.quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
        />
      </div>
    </div>
  );
}
