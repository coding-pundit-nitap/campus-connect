import { Store } from "lucide-react";
import React from "react";

import { Shops } from "@/components/homepage/shop/shops";

export default function Page() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 ring-4 ring-orange-500/5">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-foreground">
                Campus Partner Shops
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed font-medium">
                Explore active campus canteens, stores, and dining spots
                delivering straight to your building.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6">
          <Shops />
        </div>
      </div>
    </div>
  );
}
