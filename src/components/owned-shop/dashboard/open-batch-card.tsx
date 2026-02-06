"use client";

import { Clock, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLockBatch } from "@/hooks/queries/useBatch";
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

  const cutoffTime = new Date(batch.cutoff_time);
  const formattedTime = cutoffTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg text-muted-foreground">
              Collecting Orders
            </CardTitle>
          </div>
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Closes at {formattedTime}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold">{batch.order_count}</div>
            <div className="text-xs text-muted-foreground">Orders so far</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold">{timeRemaining}</div>
            <div className="text-xs text-muted-foreground">mins remaining</div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          This batch will auto-close and become ready for delivery.
        </p>

        <Button
          className="w-full"
          variant="secondary"
          disabled={lockBatch.isPending}
          onClick={() => lockBatch.mutate(batch.id)}
        >
          {lockBatch.isPending ? "Locking..." : "Lock Batch Now (Start Prep)"}
        </Button>
      </CardContent>
    </Card>
  );
}
