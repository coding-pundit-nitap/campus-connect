"use client";

import { Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToggleShopStatus } from "@/hooks/queries/useShop";

interface ShopStatusToggleProps {
  shopId: string;
  isActive: boolean;
}

export function ShopStatusToggle({ shopId, isActive }: ShopStatusToggleProps) {
  const { mutate: toggleStatus, isPending } = useToggleShopStatus(shopId);

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Switch
          id="shop-status"
          checked={isActive}
          onCheckedChange={() => toggleStatus()}
          disabled={isPending}
        />
      )}
      <Label htmlFor="shop-status" className="text-sm font-medium">
        {isActive ? "Open" : "Closed"}
      </Label>
    </div>
  );
}
