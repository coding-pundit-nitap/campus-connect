"use client";

import { Clock, PauseCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNextSlot } from "@/hooks/queries/useBatch";

interface BatchCountdownBannerProps {
  shopId: string;
}

const formatDuration = (minutes: number) => {
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${minutes} min`;
};

export function BatchCountdownBanner({ shopId }: BatchCountdownBannerProps) {
  const { data, isLoading, isError } = useNextSlot(shopId);

  const [minutesRemaining, setMinutesRemaining] = useState<number>(0);

  useEffect(() => {
    if (!data?.enabled || !data.cutoff_time || !data.is_open) return;

    const updateTimer = () => {
      const now = new Date();
      const cutoff = new Date(data.cutoff_time!);
      const remaining = Math.max(0, cutoff.getTime() - now.getTime());
      const minutes = Math.ceil(remaining / 60000);

      setMinutesRemaining(minutes);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [data?.enabled, data?.cutoff_time, data?.is_open]);

  if (isLoading || isError || !data || !data.enabled) {
    return null;
  }

  if (!data.is_open) {
    return (
      <Alert className="rounded-xl border bg-card px-4 py-3 shadow-sm">
        <AlertDescription className="flex items-center gap-3">
          <PauseCircle className="h-4 w-4 text-muted-foreground" />

          <div>
            <p className="font-medium text-foreground">
              Orders temporarily paused
            </p>
            <p className="text-sm text-muted-foreground">
              Please check back later
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data.cutoff_time) {
    return null;
  }

  const cutoffTime = new Date(data.cutoff_time);

  const formattedTime = cutoffTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCritical = minutesRemaining <= 1;
  const isUrgent = minutesRemaining > 1 && minutesRemaining <= 5;

  const getStyles = () => {
    if (isCritical) {
      return {
        container: "border-red-300 bg-red-50 dark:bg-red-950/20",
        icon: "text-red-600 dark:text-red-400",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      };
    }

    if (isUrgent) {
      return {
        container: "border-orange-300 bg-orange-50 dark:bg-orange-950/20",
        icon: "text-orange-600 dark:text-orange-400",
        badge:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      };
    }

    return {
      container: "border-amber-200 bg-amber-50 dark:bg-amber-950/20",
      icon: "text-amber-600 dark:text-amber-400",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    };
  };

  const styles = getStyles();

  const getTitle = () => {
    if (isCritical) return "Batch closes in under a minute";
    if (isUrgent) return "Last chance to order";
    return `Next batch closes in ${formatDuration(minutesRemaining)}`;
  };

  const getSubtitle = () => {
    if (isCritical || isUrgent) {
      return `Delivery at ${formattedTime}`;
    }

    return `Delivery at ${formattedTime}`;
  };

  return (
    <Alert
      className={`rounded-xl border px-4 py-3 shadow-sm transition-colors ${styles.container}`}
    >
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">
            {isCritical || isUrgent ? (
              <Zap className={`h-4 w-4 ${styles.icon}`} />
            ) : (
              <Clock className={`h-4 w-4 ${styles.icon}`} />
            )}
          </div>

          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{getTitle()}</p>
            <p className="text-sm text-muted-foreground truncate">
              {getSubtitle()}
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={`shrink-0 font-medium ${styles.badge}`}
        >
          {formatDuration(minutesRemaining)}
        </Badge>
      </AlertDescription>
    </Alert>
  );
}
