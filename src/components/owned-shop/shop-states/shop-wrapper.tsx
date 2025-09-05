import React from "react";

import { ShopAction } from "@/components/owned-shop/shop-header/shop-action";
import { SharedCard } from "@/components/shared/shared-card";
import { Separator } from "@/components/ui/separator";

interface ShopWrapperProps {
  children: React.ReactNode;
}

export function ShopWrapper({ children }: ShopWrapperProps) {
  return (
    <SharedCard
      title="Shop Product Management"
      headerClassName="flex flex-row justify-between"
      headerContent={<ShopAction />}
    >
      <Separator />
      {children}
    </SharedCard>
  );
}
