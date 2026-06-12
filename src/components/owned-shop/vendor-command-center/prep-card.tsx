import { Bike } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { getItemsText } from "@/lib/utils/order-utils";
import { SerializedOrderWithDetails } from "@/types";

import { OrderMeta } from "./order-meta";

export function PrepCard({
  order,
  onStartDirect,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  onStartDirect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/[0.02] transition-all duration-200 flex flex-col justify-between">
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold font-heading text-sm text-foreground">
                  {order.display_id}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] tracking-wider uppercase px-1.5 py-0 rounded-md font-bold",
                    order.is_direct_delivery
                      ? "border-red-500/20 bg-red-500/10 text-red-500"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  )}
                >
                  {order.is_direct_delivery ? "Direct" : "Accepted"}
                </Badge>
              </div>
              <OrderMeta order={order} />
            </div>
            <span className="text-sm font-extrabold text-foreground tabular-nums shrink-0">
              {formatCurrency(order.total_price)}
            </span>
          </div>

          <Separator className="bg-border/20" />

          <p className="wrap-break-word text-xs text-muted-foreground font-semibold leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/10">
            {getItemsText(order)}
          </p>
        </div>

        {order.is_direct_delivery && (
          <Button
            type="button"
            size="sm"
            onClick={() => onStartDirect(order.id)}
            disabled={disabled}
            className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-98 shadow shadow-emerald-500/10 border-none mt-3"
          >
            <Bike className="mr-1.5 h-3.5 w-3.5" />
            Start Direct Delivery
          </Button>
        )}
      </div>
    </Card>
  );
}
