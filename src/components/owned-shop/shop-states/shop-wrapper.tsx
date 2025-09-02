import React from "react";

import { SharedCard } from "@/components/shared/shared-card";
import { Separator } from "@/components/ui/separator";

import { ShopAction } from "../shop-header/shop-action";

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
