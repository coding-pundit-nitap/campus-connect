import { Store } from "lucide-react";
import React from "react";

import { Shops } from "@/components/homepage/shop/shops";

export default function Page() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground/80">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-foreground">
                Campus partner shops
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed font-medium">
                Canteens, stationery and general stores, delivering straight to
                your hostel.
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
