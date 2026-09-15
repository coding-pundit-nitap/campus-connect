"use client";

import React from "react";

import { Progress } from "@/components/ui/progress";
import { useBatchProgress } from "@/hooks/utils/useBatchProgress";
import { cn } from "@/lib/cn";

interface BatchProgressProps {
  shopId: string;
}

export function BatchProgress({ shopId }: BatchProgressProps) {
  const { data } = useBatchProgress(shopId);

  if (!data || data.minRequired === null) {
    return null;
  }

  const { collectiveTotal, minRequired, isMet } = data;
  const percentage = Math.min((collectiveTotal / minRequired) * 100, 100);
  const remaining = Math.max(minRequired - collectiveTotal, 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Batch Progress (all students)
        </span>
        <span
          className={cn(
            "text-sm font-semibold",
            isMet ? "text-green-600" : "text-amber-600"
          )}
        >
          {isMet ? "✓ Batch confirmed" : `₹${remaining.toFixed(0)} more needed`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          ₹{collectiveTotal.toFixed(0)}/₹{minRequired.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
