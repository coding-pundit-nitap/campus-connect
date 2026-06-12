import { cn } from "@/lib/cn";

export function KpiPill({
  label,
  count,
  theme,
}: {
  label: string;
  count: number;
  theme: "amber" | "emerald" | "blue";
}) {
  const styles = {
    amber: {
      bg: "bg-amber-500/[0.08] dark:bg-amber-500/[0.04]",
      border: "border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      ring: "bg-amber-500/10 ring-4 ring-amber-500/10",
      badgeBg: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.04]",
      border: "border-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "bg-emerald-500/10 ring-4 ring-emerald-500/10",
      badgeBg: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
    },
    blue: {
      bg: "bg-blue-500/[0.08] dark:bg-blue-500/[0.04]",
      border: "border-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
      ring: "bg-blue-500/10 ring-4 ring-blue-500/10",
      badgeBg: "bg-blue-500 text-white shadow-md shadow-blue-500/20",
    },
  }[theme];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-102",
        styles.bg,
        styles.border
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-all duration-300",
          styles.badgeBg,
          styles.ring
        )}
      >
        {count}
      </div>
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          styles.text
        )}
      >
        {label}
      </span>
    </div>
  );
}
