"use client";

import { useEffect, useEffectEvent, useState } from "react";

interface DateDisplayProps {
  date: Date | string | null | undefined;
  className?: string;
  showTime?: boolean;
}

export function DateDisplay({
  date,
  className,
  showTime = true,
}: DateDisplayProps) {
  const [mounted, setMounted] = useState(false);

  const setMountedTrue = useEffectEvent(() => {
    setMounted(true);
  });

  useEffect(() => {
    setMountedTrue();
  }, []);

  if (!date) return null;

  const dateObj = new Date(date);
  if (!mounted) {
    return (
      <span className={className}>
        {dateObj.toISOString().slice(0, 16).replace("T", " ")} UTC
      </span>
    );
  }

  return (
    <span className={className}>
      {dateObj.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: showTime ? "short" : undefined,
      })}
    </span>
  );
}
