import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/currency";
import { getItemsText } from "@/lib/utils/order-utils";
import { SerializedOrderWithDetails } from "@/types";

export function DispatchCard({
  order,
  otp,
  onOtpChange,
  onVerify,
  disabled,
}: {
  order: SerializedOrderWithDetails;
  otp: string;
  onOtpChange: (id: string, val: string) => void;
  onVerify: (id: string) => void;
  disabled: boolean;
}) {
  const phone = order.user?.phone;

  return (
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-md overflow-hidden hover:scale-[1.01] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/[0.02] transition-all duration-200 flex flex-col justify-between">
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold font-heading text-sm text-foreground">
                  {order.display_id}
                </span>
                {order.is_direct_delivery && (
                  <Badge
                    variant="outline"
                    className="text-[9px] tracking-wider uppercase px-1.5 py-0 rounded-md font-bold border-red-500/20 bg-red-500/10 text-red-500"
                  >
                    Direct
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 text-xs font-bold text-foreground">
                Room {order.delivery_address_snapshot?.room_number}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-1">
                <span className="truncate max-w-[100px]">
                  {order.user?.name || "Unknown"}
                </span>
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    <Phone className="h-2.5 w-2.5" />
                    {phone}
                  </a>
                )}
              </div>
            </div>
            <div className="text-right text-sm shrink-0 tabular-nums">
              <div className="font-extrabold text-foreground">
                {formatCurrency(order.total_price)}
              </div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                {order.payment_method}
              </div>
            </div>
          </div>

          <Separator className="bg-border/20" />

          <p className="wrap-break-word rounded-xl bg-muted/30 p-2.5 text-xs font-semibold text-muted-foreground leading-relaxed border border-border/10">
            {getItemsText(order)}
          </p>
        </div>

        <div className="mt-3.5 pt-1">
          {order.order_status === "OUT_FOR_DELIVERY" ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                aria-label={`OTP for ${order.display_id}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                spellCheck={false}
                pattern="[0-9]*"
                maxLength={4}
                placeholder="OTP…"
                value={otp}
                onChange={(e) =>
                  onOtpChange(order.id, e.target.value.replace(/\D/g, ""))
                }
                className="text-center font-mono tracking-widest tabular-nums h-10 rounded-xl bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 text-xs font-bold"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => onVerify(order.id)}
                disabled={disabled || otp.length !== 4}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow shadow-blue-500/10 border-none"
              >
                Verify
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border-blue-500/20 bg-blue-500/10 text-blue-600"
            >
              Ready for dispatch
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
