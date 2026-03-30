"use client";

import { MapPin, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type HostelGroupedOrder = {
  id: string;
  display_id: string;
  delivery_address?: {
    hostel_block: string | null;
    label: string;
    building: string;
    room_number: string;
  } | null;
};

function getHostelKey(order: HostelGroupedOrder): string {
  const raw = order.delivery_address?.hostel_block?.trim();
  return raw && raw.length > 0 ? raw : "Unassigned";
}

export function BatchHostelBlockView({
  title = "Hostel Block Grouping",
  orders,
  className,
}: {
  title?: string;
  orders: HostelGroupedOrder[] | undefined;
  className?: string;
}) {
  if (!orders || orders.length === 0) return null;

  const groups = orders.reduce<Record<string, HostelGroupedOrder[]>>(
    (acc, order) => {
      const key = getHostelKey(order);
      acc[key] ??= [];
      acc[key].push(order);
      return acc;
    },
    {}
  );

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  return (
    <section className={cn("space-y-4 w-full", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
          {title}
        </h3>
        <Badge variant="secondary" className="px-2">
          {orders.length} Total
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedKeys.map((hostel) => {
          const hostelOrders = groups[hostel] ?? [];
          const isUnassigned = hostel === "Unassigned";

          return (
            <div
              key={hostel}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md flex flex-col",
                isUnassigned &&
                  "border-dashed bg-muted/10 opacity-80 hover:opacity-100"
              )}
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-md flex items-center gap-1.5",
                    isUnassigned
                      ? "bg-muted text-muted-foreground"
                      : "bg-indigo-100 dark:bg-indigo-900/40"
                  )}
                >
                  {isUnassigned ? (
                    <Package className="h-3.5 w-3.5" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      isUnassigned
                        ? "text-muted-foreground"
                        : "text-indigo-700 dark:text-indigo-300"
                    )}
                  >
                    {isUnassigned ? "Unassigned" : `Block ${hostel}`}
                  </span>
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1">
                  {hostelOrders.length} stop
                  {hostelOrders.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Order IDs */}
              <div className="flex flex-wrap gap-1.5 mb-3 flex-1">
                {hostelOrders
                  .slice()
                  .sort((a, b) => a.display_id.localeCompare(b.display_id))
                  .map((o) => (
                    <Badge
                      key={o.id}
                      variant="secondary"
                      className="font-mono text-[10px] px-1.5 py-0 border-border/50 bg-background shadow-sm"
                    >
                      #{o.display_id}
                    </Badge>
                  ))}
              </div>

              {/* Room Previews */}
              {!isUnassigned && (
                <div className="mt-auto pt-3 border-t border-border/50">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground leading-tight">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
                    <p className="line-clamp-2">
                      {hostelOrders
                        .map((o) =>
                          o.delivery_address
                            ? `Rm ${o.delivery_address.room_number}`
                            : null
                        )
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(", ")}
                      {hostelOrders.length > 3 ? " ..." : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
