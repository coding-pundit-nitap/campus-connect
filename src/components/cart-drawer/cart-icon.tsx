import { ShoppingCart } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";

type Props = {
  totalItems: number;
};

export function CartIcon({ totalItems }: Props) {
  return (
    <>
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <Badge
          variant="outline"
          className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black bg-orange-500 text-white border-2 border-background shadow-xs hover:bg-orange-600 transition-colors"
        >
          {totalItems}
        </Badge>
      )}
    </>
  );
}
