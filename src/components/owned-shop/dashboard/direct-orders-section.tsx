"use client";

import { Check, ChevronRight, MapPin, Phone } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useStartIndividualDelivery, useVerifyIndividualOtp } from "@/hooks";
import { cn } from "@/lib/cn";
import { DirectOrderInfo } from "@/services/batch";

function DirectOrderCard({ order }: { order: DirectOrderInfo }) {
  const [otp, setOtp] = useState("");
  const startDelivery = useStartIndividualDelivery();
  const verifyOtp = useVerifyIndividualOtp();

  const isOut = order.status === "OUT_FOR_DELIVERY";

  const handleVerify = () => {
    if (otp.length === 4) verifyOtp.mutate({ orderId: order.id, otp });
  };

  return (
    <Card className="flex flex-col relative overflow-hidden group">
      {/* Quick Status Strip */}
      <div
        className={cn(
          "h-1 w-full absolute top-0 left-0",
          isOut ? "bg-blue-500" : "bg-orange-400"
        )}
      />

      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {order.delivery_address
                ? `${order.delivery_address.hostel_block} - ${order.delivery_address.room_number}`
                : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground ml-5">
              {order.delivery_address?.building}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Call button — only shown when phone is present */}
            {order.phone && (
              <a href={`tel:${order.phone}`}>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 rounded-md border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                  title={`Call ${order.phone}`}
                >
                  <Phone className="h-3 w-3" />
                </Button>
              </a>
            )}
            <Badge variant="secondary" className="font-mono text-xs">
              #{order.display_id}
            </Badge>
          </div>
        </div>

        {/* Action Area */}
        <div className="mt-auto w-full pt-2 space-y-3">
          <div className="flex justify-between items-center bg-muted/30 p-2 rounded text-sm">
            <span className="text-muted-foreground">Earning:</span>
            <span className="font-bold text-green-600">
              ₹{order.total_earnings.toFixed(0)}
            </span>
          </div>

          {!isOut ? (
            <Button
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => startDelivery.mutate(order.id)}
              disabled={startDelivery.isPending}
            >
              Start Delivery <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <div className="flex w-full gap-2 items-center">
              {/*
                FIX: InputOTPSlot must use explicit fixed sizes (e.g. h-9 w-9),
                NOT w-full — w-full inside a flex group collapses the slots.
                The InputOTPGroup itself is set to flex so slots share space evenly.
              */}
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup className="flex flex-1 gap-1">
                  <InputOTPSlot
                    index={0}
                    className="h-9 flex-1 min-w-0 border rounded-md"
                  />
                  <InputOTPSlot
                    index={1}
                    className="h-9 flex-1 min-w-0 border rounded-md"
                  />
                  <InputOTPSlot
                    index={2}
                    className="h-9 flex-1 min-w-0 border rounded-md"
                  />
                  <InputOTPSlot
                    index={3}
                    className="h-9 flex-1 min-w-0 border rounded-md"
                  />
                </InputOTPGroup>
              </InputOTP>
              <Button
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 rounded-md transition-colors",
                  otp.length === 4
                    ? "bg-green-600 hover:bg-green-700 animate-pulse"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={handleVerify}
                disabled={otp.length !== 4 || verifyOtp.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function DirectOrdersSection({ orders }: { orders: DirectOrderInfo[] }) {
  if (orders.length === 0) return null;
  return (
    <section className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
          Direct Orders
        </h3>
        <Badge variant="outline" className="text-xs">
          {orders.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {orders.map((order) => (
          <DirectOrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
