"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedKeys.map((hostel) => {
          const hostelOrders = groups[hostel] ?? [];
          return (
            <div key={hostel} className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{hostel}</span>
                  <Badge variant="secondary" className="font-mono">
                    {hostelOrders.length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Drop together
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {hostelOrders
                  .slice()
                  .sort((a, b) => a.display_id.localeCompare(b.display_id))
                  .map((o) => (
                    <Badge key={o.id} variant="outline" className="font-mono">
                      {o.display_id}
                    </Badge>
                  ))}
              </div>

              {hostel !== "Unassigned" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {hostelOrders
                    .map((o) =>
                      o.delivery_address
                        ? `${o.delivery_address.label}: ${o.delivery_address.building}, Room ${o.delivery_address.room_number}`
                        : null
                    )
                    .filter(Boolean)
                    .slice(0, 2)
                    .join(" • ")}
                  {hostelOrders.length > 2 ? " …" : ""}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
