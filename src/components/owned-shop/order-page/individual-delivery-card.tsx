"use client";

import { Check, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useStartIndividualDelivery, useVerifyIndividualOtp } from "@/hooks";
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

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>Individual delivery</CardTitle>
        <CardDescription>
          Deliver this order without waiting for a batch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canStart && (
          <Button
            className="w-full"
            onClick={() => startDelivery.mutate(orderId)}
            disabled={startDelivery.isPending}
          >
            <Truck className="mr-2 h-4 w-4" />
            {startDelivery.isPending
              ? "Starting…"
              : "Start delivery for this order"}
          </Button>
        )}

        {canVerify && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter the 4-digit OTP from the customer.
            </p>
            <div className="flex items-center gap-3">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <Button
                onClick={() => verifyOtp.mutate({ orderId, otp })}
                disabled={verifyOtp.isPending || otp.length < 4}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!canStart && !canVerify && (
          <p className="text-sm text-muted-foreground">
            This order is {status.replaceAll("_", " ").toLowerCase()}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
