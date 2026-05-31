"use client";

import {
  CheckCircle,
  CheckCircle2,
  Compass,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  useCompleteBatch,
  useOrderConsoleData,
  useStartDelivery,
  useVerifyDeliveryOtp,
} from "@/hooks/queries/useBatch";
import { formatCurrency } from "@/lib/utils/currency";
import { getHostel, safeParseAddress } from "@/lib/utils/order-utils";
import { SerializedOrderWithDetails } from "@/types";

export function DeliveryRunView() {
  const { data, isLoading } = useOrderConsoleData();
  const orders = data?.deliveryOrders || [];

  const verifyOtpMutation = useVerifyDeliveryOtp();
  const startDeliveryMutation = useStartDelivery();
  const completeBatchMutation = useCompleteBatch();

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  const isPending =
    verifyOtpMutation.isPending ||
    startDeliveryMutation.isPending ||
    completeBatchMutation.isPending;

  const handleVerifyOtp = (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }

    verifyOtpMutation.mutate(
      { orderId, otp },
      {
        onSuccess: () => {
          setOtpInputs((prev) => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="All caught up!"
        description="No orders currently require delivery."
        icon={<CheckCircle className="h-12 w-12 text-green-500/50" />}
      />
    );
  }

  // Group unique batches associated with these orders
  const uniqueBatches = Array.from(
    new Map(
      orders.filter((o) => o.batch !== null).map((o) => [o.batch!.id, o.batch!])
    ).values()
  );

  const groups: Record<string, SerializedOrderWithDetails[]> = {};
  orders.forEach((order: SerializedOrderWithDetails) => {
    const block = getHostel(order);
    if (!groups[block]) groups[block] = [];
    groups[block].push(order);
  });

  return (
    <div className="space-y-6">
      {/* Fulfillment Control Panel for Active Batches */}
      {uniqueBatches.map((batch) => {
        const batchOrders = orders.filter((o) => o.batch?.id === batch.id);
        const pendingOrders = batchOrders.filter(
          (o) =>
            o.order_status === "BATCHED" ||
            o.order_status === "OUT_FOR_DELIVERY"
        );
        const pendingCount = pendingOrders.length;

        return (
          <Card
            key={batch.id}
            className="border-t-4 border-t-primary shadow-md overflow-hidden bg-linear-to-br from-card to-muted/10"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery Run Control Panel
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Batch ID: {batch.id.substring(0, 8)} • Cutoff:{" "}
                    {new Date(batch.cutoff_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </div>
                <Badge
                  variant={batch.status === "LOCKED" ? "outline" : "default"}
                  className={
                    batch.status === "LOCKED"
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-blue-500 text-white"
                  }
                >
                  {batch.status === "LOCKED" ? "Ready to Start" : "In Transit"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {batch.status === "LOCKED" ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  <div className="text-sm">
                    <span className="font-semibold text-amber-800 dark:text-amber-400">
                      📦 Batch ready for dispatch!
                    </span>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Start the delivery run to mark orders as OUT_FOR_DELIVERY
                      and notify customers.
                    </p>
                  </div>
                  <Button
                    onClick={() => startDeliveryMutation.mutate(batch.id)}
                    disabled={isPending}
                    className="w-full sm:w-auto shadow-sm bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    🚗 Start Delivery Run
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <div className="text-sm">
                    <span className="font-semibold text-blue-800 dark:text-blue-400">
                      🚴 Out for Delivery!
                    </span>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {pendingCount} of {batchOrders.length} orders remaining to
                      verify.
                    </p>
                  </div>
                  <Button
                    onClick={() => completeBatchMutation.mutate(batch.id)}
                    disabled={isPending || pendingCount > 0}
                    className="w-full sm:w-auto shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {pendingCount > 0
                      ? "Verify All OTPs to Complete"
                      : "🎉 Complete Batch Run"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Hostel Blocks Grouped Routes */}
      {Object.entries(groups).map(([block, blockOrders]) => (
        <div key={block} className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground/90 pt-2">
            <Compass className="h-5 w-5 text-primary/80" />
            Hostel Block: {block}
            <Badge
              variant="secondary"
              className="font-semibold bg-muted text-muted-foreground"
            >
              {blockOrders.length}
            </Badge>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blockOrders.map((order: SerializedOrderWithDetails) => {
              const snapshot = safeParseAddress(order);

              const isCompleted = order.order_status === "COMPLETED";

              return (
                <Card
                  key={order.id}
                  className={`overflow-hidden transition-all duration-200 hover:shadow-md ${isCompleted ? "bg-muted/30 border-muted opacity-75" : ""}`}
                >
                  <CardContent className="p-5 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">
                            {order.display_id}
                          </span>
                          {isCompleted && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Delivered
                            </Badge>
                          )}
                          {!isCompleted && order.is_direct_delivery && (
                            <Badge
                              variant="destructive"
                              className="bg-red-500/10 text-red-500 border-red-100"
                            >
                              Direct
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-foreground/80 mt-1">
                          Room {snapshot?.room_number || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {order.user?.name} • {order.user?.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-base text-foreground/90">
                          {formatCurrency(order.total_price)}
                        </span>
                        <div className="text-[10px] font-mono font-semibold uppercase mt-1 px-2 py-0.5 bg-muted rounded text-muted-foreground tracking-wider inline-block">
                          {order.payment_method}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm bg-muted/40 p-3 rounded-lg border border-muted/20">
                      <Package className="h-4 w-4 mt-0.5 text-muted-foreground/75" />
                      <div className="text-xs text-foreground/80 leading-relaxed font-medium">
                        {order.items
                          .map((i) => `${i.quantity}x ${i.product.name}`)
                          .join(", ")}
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="flex items-center gap-2 pt-3 border-t mt-auto">
                        <Input
                          placeholder="Enter OTP"
                          value={otpInputs[order.id] || ""}
                          onChange={(e) =>
                            setOtpInputs((prev) => ({
                              ...prev,
                              [order.id]: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          className="font-mono text-sm tracking-widest text-center"
                          maxLength={4}
                        />
                        <Button
                          onClick={() => handleVerifyOtp(order.id)}
                          disabled={isPending || !otpInputs[order.id]}
                          className="shadow-sm font-semibold"
                        >
                          Verify & Handover
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
