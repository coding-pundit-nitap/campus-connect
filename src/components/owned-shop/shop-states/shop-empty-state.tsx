import React from "react";

import { ShopWrapper } from "./shop-wrapper";

export function ShopEmptyState() {
  return (
    <ShopWrapper>
      <div className="flex items-center justify-center h-full min-h-48">
        <p className="text-muted-foreground">
          You don&apos;t have any products linked.
        </p>
      </div>
    </ShopWrapper>
  );
}
