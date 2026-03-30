"use client";

import { Check, MapPin, Navigation, Package, Phone, Truck } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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

  const StatusIcon = isOut ? Truck : Package;

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all",
        isOut
          ? "border-l-4 border-l-blue-500"
          : "border-l-4 border-l-orange-400"
      )}
    >
      {/* Universal Header - Matches ActiveBatchCard */}
      <div className="bg-muted/30 p-4 flex justify-between items-start border-b shrink-0">
        <div className="flex gap-3">
          <div
            className={cn(
              "p-2 rounded-lg h-fit",
              isOut
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
            )}
          >
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              {order.delivery_address
                ? `Room ${order.delivery_address.room_number}`
                : "No Location"}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground gap-1.5 mt-1">
              <MapPin className="h-3 w-3" />
              <span>
                Block {order.delivery_address?.hostel_block} •{" "}
                {order.delivery_address?.building}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            ₹{order.total_earnings.toFixed(0)}
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[10px] mt-0.5 px-1.5"
          >
            #{order.display_id}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Customer Contact
          </span>
          {order.phone ? (
            <a href={`tel:${order.phone}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-2 rounded-lg border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </Button>
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">Not provided</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-muted/10 border-t mt-auto">
        {!isOut ? (
          <Button
            className="w-full text-sm font-medium h-10 shadow-sm bg-orange-600 hover:bg-orange-700"
            onClick={() => startDelivery.mutate(order.id)}
            disabled={startDelivery.isPending}
          >
            <Navigation className="mr-2 h-4 w-4" /> Start Delivery
          </Button>
        ) : (
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
                  ? "bg-green-600 hover:bg-green-700 animate-pulse"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={handleVerify}
              disabled={otp.length !== 4 || verifyOtp.isPending}
            >
              <Check className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function DirectOrdersSection({ orders }: { orders: DirectOrderInfo[] }) {
  if (orders.length === 0) return null;

  return (
    <section className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Direct Orders</h2>
        <Badge variant="secondary" className="px-2">
          {orders.length} Active
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <DirectOrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
