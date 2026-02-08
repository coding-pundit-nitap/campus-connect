"use client";

import { Check, ChevronRight, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
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
  const [showOtp, setShowOtp] = useState(false);
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
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {order.delivery_address
                ? `${order.delivery_address.hostel_block} - ${order.delivery_address.room_number}`
                : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground ml-5">
              {order.delivery_address?.building}
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            #{order.display_id}
          </Badge>
        </div>

        {/* Action Area */}
        <div className="mt-auto pt-2 space-y-3">
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
            <div className="space-y-2">
              <div className="flex gap-2">
                <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="h-9 flex-1">
                    <InputOTPSlot className="h-9 w-full" index={0} />
                    <InputOTPSlot className="h-9 w-full" index={1} />
                    <InputOTPSlot className="h-9 w-full" index={2} />
                    <InputOTPSlot className="h-9 w-full" index={3} />
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  size="icon"
                  className="h-9 w-9 bg-green-600 hover:bg-green-700 shrink-0"
                  onClick={handleVerify}
                  disabled={otp.length !== 4}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
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
    <section className="space-y-3">
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
