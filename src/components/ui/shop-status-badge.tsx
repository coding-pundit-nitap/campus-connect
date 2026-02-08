"use client";

import { XCircle } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { isShopOpen } from "@/lib/shop-utils";

type ShopStatusBadgeProps = {
  shop: {
    opening: string;
    closing: string;
    is_active: boolean;
  };
};

function useShopOpenStatus(shop: ShopStatusBadgeProps["shop"]) {
  const [shopOpen, setShopOpen] = useState(() => isShopOpen(shop));

  useEffect(() => {
    const interval = setInterval(() => {
      setShopOpen(isShopOpen(shop));
    }, 60000);

    return () => clearInterval(interval);
  }, [shop]);

  return shopOpen;
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ShopStatusBadge({ shop }: ShopStatusBadgeProps) {
  const isClient = useIsClient();
  const shopOpen = useShopOpenStatus(shop);

  if (!shop.is_active) {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  }

  if (!isClient) {
    return (
      <Badge variant="secondary" suppressHydrationWarning>
        ...
      </Badge>
    );
  }

  return (
    <Badge
      variant={shopOpen ? "default" : "destructive"}
      className={shopOpen ? "bg-blue-500 hover:bg-blue-600" : ""}
      suppressHydrationWarning
    >
      {shopOpen ? "Open" : "Closed"}
    </Badge>
  );
}
