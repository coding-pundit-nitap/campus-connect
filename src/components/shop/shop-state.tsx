import React from "react";

import { SharedCard } from "../shared/shared-card";
import { Separator } from "../ui/separator";
import ShopAction from "./shop-action";

interface ShopWrapperProps {
  children: React.ReactNode;
}

export function ShopWrapper({ children }: ShopWrapperProps) {
  return (
    <SharedCard
      title="Shop Management"
      headerClassName="flex flex-row  justify-between"
      headerContent={<ShopAction />}
    >
      <Separator />
      {children}
    </SharedCard>
  );
}

export function ShopLoadingState() {
  return (
    <ShopWrapper>
      <div className="flex items-center justify-center h-full min-h-48">
        <p className="text-muted-foreground">Loading shop...</p>
      </div>
    </ShopWrapper>
  );
}

export function ShopErrorState() {
  return (
    <ShopWrapper>
      <div className="flex items-center justify-center h-full min-h-48">
        <p className="text-destructive">
          Failed to load shop. Please try again.
        </p>
      </div>
    </ShopWrapper>
  );
}

export function ShopEmptyState() {
  return (
    <ShopWrapper>
      <div className="flex items-center justify-center h-full min-h-48">
        <p className="text-muted-foreground">
          You don&apos;t have any shops linked.
        </p>
      </div>
    </ShopWrapper>
  );
}
