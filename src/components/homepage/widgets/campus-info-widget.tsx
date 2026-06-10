"use client";

import { Mountain, Store } from "lucide-react";
import React from "react";

export default function CampusInfoWidget() {
  return (
    <div className="relative w-full rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.12)] transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,0.2)] hover:border-primary/45">
      <h3 className="font-heading font-black text-base uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-orange-500" />
        <span>Altitude Gap</span>
      </h3>

      <div className="relative flex flex-col gap-6 pl-4 border-l-2 border-dotted border-primary/30 py-2">
        {/* Hostel Top Step */}
        <div className="relative flex items-start gap-3">
          <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-black uppercase text-foreground bg-primary/10 px-1.5 py-0.5 rounded-md">
                300m Elev.
              </span>
              <span className="text-xs font-black text-foreground">
                Hostel Blocks
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Student drops points at Hostel gate.
            </p>
          </div>
        </div>

        {/* The Climb Indicator */}
        <div className="relative flex items-start gap-3">
          <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center border-2 border-background shadow-sm animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-black uppercase text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
                ▲ 100m Climb
              </span>
              <span className="text-xs font-black text-foreground">
                Batch Delivery
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Orders grouped by slot to make the climb profitable.
            </p>
          </div>
        </div>

        {/* Lower Market Bottom Step */}
        <div className="relative flex items-start gap-3">
          <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-muted-foreground flex items-center justify-center border-2 border-background shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-black uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                200m Elev.
              </span>
              <span className="text-xs font-black text-foreground">
                Lower Market
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Campus canteens and local vendor shops.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
        <Store className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider">
          Connecting Campus & Community
        </span>
      </div>
    </div>
  );
}
