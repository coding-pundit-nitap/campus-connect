"use client";

import {
  Calendar,
  Clock,
  CreditCard,
  Hash,
  Key,
  MapPin,
  Package,
  Store,
} from "lucide-react";
import React from "react";

import { DateDisplay } from "@/components/shared/date-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
};

const InfoRow = ({
  Icon,
  label,
  children,
}: {
  Icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
    <div className="flex-1 wrap-break-words">
      <p className="font-medium">{label}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  </div>
);

export default function OrderDetailsInfo({ order }: Props) {
  const {
    items,
    delivery_address_snapshot,
    requested_delivery_time,
    estimated_delivery_time,
    actual_delivery_time,
    batch,
    payment_method,
    payment_status,
    upi_transaction_id,
    order_status,
    delivery_otp,
  } = order;

  const showOtp = order_status === "OUT_FOR_DELIVERY" && delivery_otp;

  return (
    <div className="space-y-4 col-span-1">
      {showOtp && (
        <Card className="py-4 border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              Delivery OTP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Show this code to the delivery person to confirm your order
            </p>
            <div className="flex justify-center">
              <div className="flex gap-2">
                {delivery_otp.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="w-12 h-14 flex items-center justify-center bg-white dark:bg-gray-900 border-2 border-green-500 rounded-lg text-2xl font-bold text-green-700 dark:text-green-400"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-lg">Delivery Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow Icon={Store} label="Restaurant">
            {items?.[0].product.shop?.name || "Unknown"}
          </InfoRow>
          <InfoRow Icon={MapPin} label="Delivery Address">
            {delivery_address_snapshot}
          </InfoRow>

          {requested_delivery_time && (
            <InfoRow Icon={Calendar} label="Requested Delivery Time">
              <span className="font-semibold text-orange-600">
                <DateDisplay date={requested_delivery_time} />
              </span>
            </InfoRow>
          )}

          <InfoRow Icon={Package} label="Batch Slot">
            {batch ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-orange-600">
                  <DateDisplay date={batch.cutoff_time} />
                </span>
                <Badge variant="secondary" className="uppercase">
                  {batch.status}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Not assigned yet (waiting for batching)
              </span>
            )}
          </InfoRow>

          {actual_delivery_time ? (
            <InfoRow Icon={Clock} label="Delivered At">
              <span className="font-semibold text-green-600">
                <DateDisplay date={actual_delivery_time} />
              </span>
            </InfoRow>
          ) : estimated_delivery_time ? (
            <InfoRow Icon={Clock} label="Estimated Delivery">
              <span className="font-semibold text-blue-600">
                <DateDisplay date={estimated_delivery_time} />
              </span>
            </InfoRow>
          ) : null}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow Icon={CreditCard} label="Payment Method">
            <Badge variant="outline" className="capitalize">
              {payment_method.toLowerCase()}
            </Badge>
          </InfoRow>
          <InfoRow Icon={CreditCard} label="Payment Status">
            <Badge
              variant={payment_status === "COMPLETED" ? "default" : "secondary"}
              className="capitalize"
            >
              {payment_status.toLowerCase()}
            </Badge>
          </InfoRow>
          {payment_method === "ONLINE" && upi_transaction_id && (
            <InfoRow Icon={Hash} label="UPI Transaction ID">
              <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                {upi_transaction_id}
              </code>
            </InfoRow>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
