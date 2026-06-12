import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export function SectionHeader({
  icon,
  title,
  count,
  themeColor = "blue",
}: {
  icon: ReactNode;
  title: string;
  count: number;
  themeColor?: "amber" | "emerald" | "blue";
}) {
  const badgeColors = {
    amber:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }[themeColor];

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/20 pb-2.5">
      <h2 className="flex min-w-0 items-center gap-2.5 text-base font-black font-heading text-foreground">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{title}</span>
      </h2>
      <Badge
        variant="outline"
        className={cn(
          "tabular-nums font-bold rounded-lg text-xs px-2.5 py-0.5",
          badgeColors
        )}
      >
        {count} Active
      </Badge>
    </div>
  );
}
