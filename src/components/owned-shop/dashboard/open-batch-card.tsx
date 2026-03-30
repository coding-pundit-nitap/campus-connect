"use client";

import { Clock, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useLockBatch } from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";
import { BatchInfo } from "@/services/batch";

interface OpenBatchCardProps {
  batch: BatchInfo;
}

export function OpenBatchCard({ batch }: OpenBatchCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const lockBatch = useLockBatch();

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const cutoff = new Date(batch.cutoff_time);
      const remaining = Math.max(0, cutoff.getTime() - now.getTime());
      const minutes = Math.ceil(remaining / 60000);
      setTimeRemaining(minutes);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [batch.cutoff_time]);

  const cutoffDate = batch.cutoff_time ? new Date(batch.cutoff_time) : null;
  const formattedTime =
    cutoffDate && !isNaN(cutoffDate.getTime())
      ? cutoffDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <Card className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
      <div className="bg-muted/30 p-4 flex justify-between items-start border-b shrink-0">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg h-fit bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              Collecting Orders
            </h3>
            <div className="flex items-center text-xs text-muted-foreground gap-1.5 mt-1">
              <Clock className="h-3 w-3" />
              <span>Closes at {formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 flex-1">
        <div className="flex justify-evenly items-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {batch.order_count}
            </span>
            <span className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">
              Orders
            </span>
          </div>

          {/* Subtle Vertical Divider */}
          <div className="w-px h-12 bg-border"></div>

          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold tracking-tight text-emerald-600">
              {timeRemaining}
            </span>
            <span className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">
              Mins Left
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This batch will auto-close and become ready for delivery at the cutoff
          time.
        </p>
      </CardContent>

      <CardFooter className="p-4 bg-muted/10 border-t mt-auto">
        <Button
          className={cn(
            "w-full text-sm font-medium h-10 shadow-sm transition-colors",
            "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
          disabled={lockBatch.isPending}
          onClick={() => lockBatch.mutate(batch.id)}
        >
          {lockBatch.isPending ? "Locking..." : "Lock Batch Early (Start Prep)"}
        </Button>
      </CardFooter>
    </Card>
  );
}
