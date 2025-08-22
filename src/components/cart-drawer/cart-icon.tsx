import React from "react";
import { Badge } from "../ui/badge";
import { ShoppingCart } from "lucide-react";

type Props = {
  totalItems: number;
};

export function CartIcon({ totalItems }: Props) {
  return (
    <>
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {totalItems}
        </Badge>
      )}
    </>
  );
}
