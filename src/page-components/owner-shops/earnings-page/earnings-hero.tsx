"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/utils/currency";
import type { EarningsPeriod } from "@/lib/utils/earnings";

const PERIODS: { value: EarningsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export function EarningsHero({
  amount,
  orderCount,
  period,
  onPeriodChange,
  isLoading,
  isError,
}: {
  amount: number;
  orderCount: number;
  period: EarningsPeriod;
  onPeriodChange: (p: EarningsPeriod) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border/30 bg-card/45 p-6 shadow-md backdrop-blur-xl">
      <p className="text-sm font-semibold text-muted-foreground">You earned</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-12 w-48" />
      ) : isError ? (
        <p className="mt-1 text-4xl font-black tabular-nums text-muted-foreground sm:text-5xl">
          —
        </p>
      ) : (
        <p className="mt-1 text-4xl font-black tabular-nums text-foreground sm:text-5xl">
          {formatCurrency(amount)}
        </p>
      )}
      {isLoading || isError ? (
        <p className="mt-1 text-sm font-medium text-muted-foreground">—</p>
      ) : (
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {orderCount} {orderCount === 1 ? "completed order" : "completed orders"}
        </p>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPeriodChange(p.value)}
            aria-pressed={p.value === period}
            className={cn(
              "h-11 shrink-0 rounded-xl border px-4 text-xs font-bold transition-all active:scale-98",
              p.value === period
                ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/10"
                : "border-border/40 bg-card text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
