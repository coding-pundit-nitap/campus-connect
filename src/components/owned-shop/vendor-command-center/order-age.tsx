import { format } from "date-fns";

import { cn } from "@/lib/cn";
import { formatOrderAge, getOrderAgeUrgency } from "@/lib/utils/order-display";

const URGENCY_STYLES = {
  normal: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
} as const;

/**
 * Shows how long ago an order arrived, so the vendor can tell at a glance
 * which ticket has been waiting longest.
 *
 * Pure/presentational: `now` is supplied by the console's single shared
 * clock (see `index.tsx`) rather than an interval owned by this component,
 * so mounting many of these at once does not spawn many timers.
 *
 * `escalate` should be true only where the vendor still owes an action
 * (the intake queue); elsewhere the age is informational.
 */
export function OrderAge({
  createdAt,
  isFood,
  escalate = false,
  now,
}: {
  createdAt: Date | string;
  isFood: boolean;
  escalate?: boolean;
  now: Date;
}) {
  const urgency = escalate
    ? getOrderAgeUrgency(createdAt, isFood, now)
    : "normal";
  const absolute = format(new Date(createdAt), "h:mm a");

  return (
    <span
      title={absolute}
      className={cn(
        "font-semibold tabular-nums",
        URGENCY_STYLES[urgency],
        urgency === "critical" && "font-extrabold"
      )}
    >
      {formatOrderAge(createdAt, now)}
    </span>
  );
}
