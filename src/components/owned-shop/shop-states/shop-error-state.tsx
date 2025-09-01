import React from "react";

import { ShopWrapper } from "./shop-wrapper";

export function ShopErrorState() {
  return (
    <ShopWrapper>
      <div className="flex items-center justify-center h-full min-h-48">
        <p className="text-destructive">
          Failed to load products. Please try again.
        </p>
      </div>
    </ShopWrapper>
  );
}
