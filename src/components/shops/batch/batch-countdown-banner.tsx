"use client";

import { Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNextSlot } from "@/hooks/queries/useBatch";

interface BatchCountdownBannerProps {
  shopId: string;
}

export function BatchCountdownBanner({ shopId }: BatchCountdownBannerProps) {
  const { data, isLoading, isError } = useNextSlot(shopId);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!data?.enabled || !data.cutoff_time) return;

    const cutoffTimeStr = data.cutoff_time;

    const updateTimer = () => {
      const now = new Date();
      const cutoff = new Date(cutoffTimeStr);
      const remaining = Math.max(0, cutoff.getTime() - now.getTime());
      const minutes = Math.ceil(remaining / 60000);
      setTimeRemaining(minutes);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [data?.enabled, data?.cutoff_time]);

  if (isLoading || isError || !data || !data.enabled || !data.cutoff_time) {
    return null;
  }

  const isUrgent = timeRemaining <= 5;
  const cutoffTime = new Date(data.cutoff_time);
  const formattedTime = cutoffTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Alert
      className={`border-2 ${
        isUrgent
          ? "border-red-500 bg-red-50 dark:bg-red-950/20"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
      }`}
    >
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center justify-start flex-1 gap-2">
          {isUrgent ? (
            <Zap className="h-5 w-5 text-red-600 animate-pulse" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
          <div
            className={`font-medium flex-row flex ${
              isUrgent
                ? "text-red-700 dark:text-red-400"
                : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {isUrgent ? (
              <>
                <span className="font-bold">HURRY!</span> Batch closes in{" "}
                <span className="font-mono font-bold">{timeRemaining}</span> min
              </>
            ) : (
              <>
                Next delivery batch closes at{" "}
                <span className="font-mono font-bold">{formattedTime}</span> (
                <span className="font-mono">{timeRemaining}</span> mins)
              </>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
