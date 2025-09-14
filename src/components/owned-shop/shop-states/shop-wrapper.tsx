import React from "react";

import { ShopAction } from "@/components/owned-shop/shop-header/shop-action";
import { SharedCard } from "@/components/shared/shared-card";

interface ShopWrapperProps {
  children: React.ReactNode;
}

export function ShopWrapper({ children }: ShopWrapperProps) {
  return (
    <SharedCard
      title="Shop Product Management"
      headerClassName="flex flex-row justify-between"
      headerContent={<ShopAction />}
      className="gap-0 h-full flex flex-col"
      contentClassName="flex-1 flex flex-col overflow-hidden"
    >
      {children}
    </SharedCard>
  );
}
