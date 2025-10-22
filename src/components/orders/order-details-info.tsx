import { format } from "date-fns";
import { Calendar, Clock, CreditCard, Hash, MapPin, Store } from "lucide-react";
import React from "react";

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
    shop,
    delivery_address_snapshot,
    requested_delivery_time,
    estimated_delivery_time,
    actual_delivery_time,
    payment_method,
    payment_status,
    upi_transaction_id,
  } = order;

  return (
    <div className="space-y-4 col-span-1">
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-lg">Delivery Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow Icon={Store} label="Restaurant">
            {shop.name}
          </InfoRow>
          <InfoRow Icon={MapPin} label="Delivery Address">
            {delivery_address_snapshot}
          </InfoRow>

          {requested_delivery_time && (
            <InfoRow Icon={Calendar} label="Requested Delivery Time">
              <span className="font-semibold text-orange-600">
                {format(new Date(requested_delivery_time), "PPp")}
              </span>
            </InfoRow>
          )}

          {actual_delivery_time ? (
            <InfoRow Icon={Clock} label="Delivered At">
              <span className="font-semibold text-green-600">
                {format(new Date(actual_delivery_time), "PPp")}
              </span>
            </InfoRow>
          ) : estimated_delivery_time ? (
            <InfoRow Icon={Clock} label="Estimated Delivery">
              <span className="font-semibold text-blue-600">
                {format(new Date(estimated_delivery_time), "PPp")}
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
