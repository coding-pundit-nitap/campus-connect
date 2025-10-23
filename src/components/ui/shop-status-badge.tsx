"use client";

import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { isShopOpen } from "@/lib/shop-utils";

type ShopStatusBadgeProps = {
  shop: {
    opening: string;
    closing: string;
    is_active: boolean;
  };
};

export function ShopStatusBadge({ shop }: ShopStatusBadgeProps) {
  const [shopOpen, setShopOpen] = useState(() => isShopOpen(shop));

  useEffect(() => {
    setShopOpen(isShopOpen(shop));
  }, [shop]);

  if (!shop.is_active) {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  }

  return (
    <Badge
      variant={shopOpen ? "default" : "destructive"}
      className={shopOpen ? "bg-blue-500 hover:bg-blue-600" : ""}
    >
      {shopOpen ? "Open" : "Closed"}
    </Badge>
  );
}
