import React from "react";

import { ShopWrapper } from "./shop-wrapper";

export function ShopLoadingState() {
  return (
    <ShopWrapper>
      <div className="flex items-center justify-center h-full min-h-48">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    </ShopWrapper>
  );
}
