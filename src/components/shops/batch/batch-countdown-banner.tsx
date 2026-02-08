"use client";

import { Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNextSlot } from "@/hooks/queries/useBatch";

interface BatchCountdownBannerProps {
  shopId: string;
}

interface TimeBreakdown {
  minutes: number;
  seconds: number;
}

export function BatchCountdownBanner({ shopId }: BatchCountdownBannerProps) {
  const { data, isLoading, isError } = useNextSlot(shopId);
  const [timeRemaining, setTimeRemaining] = useState<TimeBreakdown>({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!data?.enabled || !data.cutoff_time) return;

    const cutoffTimeStr = data.cutoff_time;

    const updateTimer = () => {
      const now = new Date();
      const cutoff = new Date(cutoffTimeStr);
      const remaining = Math.max(0, cutoff.getTime() - now.getTime());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining({ minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.enabled, data?.cutoff_time]);

  if (isLoading || isError || !data || !data.enabled || !data.cutoff_time) {
    return null;
  }

  const isUrgent = timeRemaining.minutes <= 5;
  const isVeryUrgent = timeRemaining.minutes === 0;
  const cutoffTime = new Date(data.cutoff_time);
  const formattedTime = cutoffTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalMinutes = 30;
  const progress = Math.max(
    0,
    Math.min(100, ((totalMinutes - timeRemaining.minutes) / totalMinutes) * 100)
  );

  return (
    <Alert
      className={`border-2 relative overflow-hidden transition-all duration-300 ${
        isVeryUrgent
          ? "border-red-600 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 shadow-lg shadow-red-200/50 dark:shadow-red-950/50"
          : isUrgent
            ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 shadow-md shadow-orange-200/30 dark:shadow-orange-950/30"
            : "border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-300 ${
          isVeryUrgent
            ? "bg-red-200/30 dark:bg-red-600/10"
            : isUrgent
              ? "bg-orange-200/30 dark:bg-orange-600/10"
              : "bg-amber-200/20 dark:bg-amber-600/10"
        }`}
        style={{ width: `${progress}%` }}
      />

      <AlertDescription className="flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                isVeryUrgent
                  ? "bg-red-200 dark:bg-red-900/40"
                  : isUrgent
                    ? "bg-orange-200 dark:bg-orange-900/40"
                    : "bg-amber-200 dark:bg-amber-900/40"
              }`}
            >
              {isVeryUrgent ? (
                <Zap className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />
              ) : isUrgent ? (
                <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-bounce" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {isVeryUrgent && (
                  <Badge variant="destructive" className="animate-pulse">
                    ⚡ CLOSING SOON
                  </Badge>
                )}
                {isUrgent && !isVeryUrgent && (
                  <Badge variant="destructive"> ⏰ Hurry Up!</Badge>
                )}
                <p
                  className={`font-semibold tracking-tight ${
                    isVeryUrgent
                      ? "text-red-700 dark:text-red-300"
                      : isUrgent
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {isVeryUrgent
                    ? "Order closing in seconds!"
                    : isUrgent
                      ? "Last chance to order!"
                      : "Next batch closes at"}
                </p>
              </div>
              <p
                className={`text-sm ${
                  isVeryUrgent
                    ? "text-red-600 dark:text-red-400"
                    : isUrgent
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                Delivery at {formattedTime}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-baseline gap-1">
              <span
                className={`font-mono font-bold text-lg transition-all ${
                  isVeryUrgent
                    ? "text-red-700 dark:text-red-300"
                    : isUrgent
                      ? "text-orange-700 dark:text-orange-300"
                      : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {String(timeRemaining.minutes).padStart(2, "0")}
              </span>
              <span
                className={`font-mono text-sm ${
                  isVeryUrgent
                    ? "text-red-600 dark:text-red-400"
                    : isUrgent
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                min
              </span>
              {(isVeryUrgent || isUrgent) && (
                <>
                  <span
                    className={`font-mono text-xs ${
                      isVeryUrgent
                        ? "text-red-600 dark:text-red-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      isVeryUrgent
                        ? "text-red-600 dark:text-red-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    sec
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className={`h-1 rounded-full overflow-hidden ${
            isVeryUrgent
              ? "bg-red-300 dark:bg-red-800/40"
              : isUrgent
                ? "bg-orange-300 dark:bg-orange-800/40"
                : "bg-amber-300 dark:bg-amber-800/40"
          }`}
        >
          <div
            className={`h-full transition-all duration-300 ${
              isVeryUrgent
                ? "bg-gradient-to-r from-red-600 to-red-500"
                : isUrgent
                  ? "bg-gradient-to-r from-orange-600 to-orange-500"
                  : "bg-gradient-to-r from-amber-600 to-amber-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </AlertDescription>
    </Alert>
  );
}
