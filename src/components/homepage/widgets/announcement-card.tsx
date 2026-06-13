"use client";

import { Megaphone } from "lucide-react";
import React from "react";

export default function AnnouncementCard() {
  return (
    <div className="relative w-full rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.12)] transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,0.2)] hover:border-primary/45">
      <h3 className="font-heading font-black text-base uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-orange-500 animate-bounce" />
        <span>Notice Board</span>
      </h3>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs font-black text-foreground">
              UPI Payments Integration
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground pl-4 leading-relaxed font-medium">
            We are working with local canteens to add automatic UPI checkouts.
            Currently, please pay cash or scan canteens&apos; personal QR codes
            upon batch delivery!
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-black text-foreground">
              Coding Club Project
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground pl-4 leading-relaxed font-medium">
            Campus Connect is proudly developed and maintained by the Coding
            Club @ NIT AP. Report bugs or suggest features at our Github!
          </p>
        </div>
      </div>
    </div>
  );
}
