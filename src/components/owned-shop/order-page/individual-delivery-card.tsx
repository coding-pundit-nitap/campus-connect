"use client";

import { Check, Navigation, Package, Truck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useStartIndividualDelivery, useVerifyIndividualOtp } from "@/hooks";
import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

export function IndividualDeliveryCard({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [otp, setOtp] = useState("");
  const startDelivery = useStartIndividualDelivery();
  const verifyOtp = useVerifyIndividualOtp();

  const canStart = useMemo(() => {
    return status === "NEW" || status === "BATCHED";
  }, [status]);

  const canVerify = status === "OUT_FOR_DELIVERY";

  // Dynamic UI configuration based on status
  const uiConfig = useMemo(() => {
    if (canStart) {
      return {
        border: "border-l-orange-400",
        iconBg:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
        icon: Package,
        title: "Ready for Delivery",
        desc: "Deliver this order without a batch.",
      };
    }
    if (canVerify) {
      return {
        border: "border-l-blue-500",
        iconBg:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
        icon: Truck,
        title: "In Transit",
        desc: "Order is out. Verify customer OTP.",
      };
    }
    if (status === "COMPLETED") {
      return {
        border: "border-l-emerald-500",
        iconBg:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        icon: Check,
        title: "Delivered",
        desc: "This order has been completed.",
      };
    }
    // Default / Cancelled state
    return {
      border: "border-l-muted-foreground/30",
      iconBg: "bg-muted text-muted-foreground",
      icon: XCircle,
      title: status.replaceAll("_", " "),
      desc: "No further actions available.",
    };
  }, [status, canStart, canVerify]);

  const StatusIcon = uiConfig.icon;

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4",
        uiConfig.border
      )}
    >
      {/* Universal Header - Matches the new design system */}
      <div className="bg-muted/30 p-4 flex gap-3 items-start border-b shrink-0">
        <div className={cn("p-2 rounded-lg h-fit", uiConfig.iconBg)}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-base leading-tight capitalize">
            {uiConfig.title.toLowerCase()}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{uiConfig.desc}</p>
        </div>
      </div>

      <CardContent className="p-4">
        {canStart && (
          <Button
            className="w-full text-sm font-medium h-10 shadow-sm bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            onClick={() => startDelivery.mutate(orderId)}
            disabled={startDelivery.isPending}
          >
            <Navigation className="mr-2 h-4 w-4" />
            {startDelivery.isPending ? "Starting…" : "Start Direct Delivery"}
          </Button>
        )}

        {canVerify && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Enter the 4-digit OTP from the customer
            </p>
            <div className="flex w-full gap-2 items-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-10 flex-1 min-w-0 border-muted-foreground/30 rounded-md bg-background"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button
                size="icon"
                className={cn(
                  "h-10 w-12 shrink-0 rounded-md transition-all shadow-sm",
                  otp.length === 4
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={() => verifyOtp.mutate({ orderId, otp })}
                disabled={verifyOtp.isPending || otp.length < 4}
              >
                <Check className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {!canStart && !canVerify && (
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5">
            <StatusIcon className="h-4 w-4" />
            Order is {status.replaceAll("_", " ").toLowerCase()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
