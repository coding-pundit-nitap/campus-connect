"use client";

import { Award } from "lucide-react";
import React from "react";

export default function ImpactStatsWidget() {
  return (
    <div className="relative w-full rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.12)] transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,0.2)] hover:border-primary/45">
      <h3 className="font-heading font-black text-base uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-500" />
        <span>Campus Impact</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Stat 1 */}
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-heading font-black uppercase text-muted-foreground tracking-wider">
            Climbs Batched
          </span>
          <div>
            <div className="text-2xl font-heading font-black text-primary mt-1">
              80%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-normal">
              Reduced vendor round trips up the slope.
            </p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-heading font-black uppercase text-muted-foreground tracking-wider">
            Campus Shops
          </span>
          <div>
            <div className="text-2xl font-heading font-black text-orange-500 mt-1">
              12+
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-normal">
              Local market canteens connected.
            </p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-heading font-black uppercase text-muted-foreground tracking-wider">
            Carbon Saved
          </span>
          <div>
            <div className="text-2xl font-heading font-black text-emerald-500 mt-1">
              92%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-normal">
              Eco-friendly bulk hostel deliveries.
            </p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/10 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-heading font-black uppercase text-muted-foreground tracking-wider">
            Walk Steps Saved
          </span>
          <div>
            <div className="text-2xl font-heading font-black text-violet-500 mt-1">
              15K+
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-normal">
              For campus students daily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
