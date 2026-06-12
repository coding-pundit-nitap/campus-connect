import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { getItemsText } from "@/lib/utils/order-utils";
import { SerializedOrderWithDetails } from "@/types";

import { OrderMeta } from "./order-meta";

export function IntakeCard({
  order,
  onAccept,
  onReject,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/[0.02] transition-all duration-200 flex flex-col justify-between">
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
                      : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                  )}
                >
                  {order.is_direct_delivery ? "Direct" : "Batch"}
                </Badge>
              </div>
              <OrderMeta order={order} />
            </div>
            <div className="text-right shrink-0 tabular-nums">
              <div className="font-extrabold text-foreground text-sm">
                {formatCurrency(order.total_price)}
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                {order.payment_method}
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          <p className="line-clamp-2 wrap-break-word text-xs text-muted-foreground font-semibold leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/10">
            {getItemsText(order)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReject(order.id)}
            disabled={disabled}
            className="h-10 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-98"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onAccept(order.id)}
            disabled={disabled}
            className="h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-102 active:scale-98 shadow shadow-amber-500/10 border-none"
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
}
