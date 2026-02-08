import React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

interface MOVProgressProps {
  currentTotal: number;
  minOrderValue: number;
}

export function MOVProgress({ currentTotal, minOrderValue }: MOVProgressProps) {
  const percentage = Math.min((currentTotal / minOrderValue) * 100, 100);
  const remaining = Math.max(minOrderValue - currentTotal, 0);
  const isMet = currentTotal >= minOrderValue;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Minimum Order Value
        </span>
        <span
          className={cn(
            "text-sm font-semibold",
            isMet ? "text-green-600" : "text-amber-600"
          )}
        >
          {isMet ? "✓ Requirement met" : `₹${remaining.toFixed(0)} more`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          ₹{currentTotal.toFixed(0)}/₹{minOrderValue.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
