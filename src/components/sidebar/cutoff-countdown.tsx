"use client";

import { Timer } from "lucide-react";
import React, { memo, useEffect, useState } from "react";

interface CutoffCountdownProps {
  targetTime: string | Date | null | undefined;
}

export const CutoffCountdown = memo(function CutoffCountdown({
  targetTime,
}: CutoffCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft("No active slot");
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetTime).getTime() - new Date().getTime();

      if (difference <= 0) {
        return "Slot closing...";
      }

      const totalMinutes = Math.floor(difference / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
      }
      return `${minutes} min remaining`;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // 60-second interval

    return () => clearInterval(interval);
  }, [targetTime]);

  if (!targetTime) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 shrink-0">
      <Timer className="h-3.5 w-3.5 animate-pulse" />
      <span className="truncate">{timeLeft}</span>
    </div>
  );
});
