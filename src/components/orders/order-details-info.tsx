import { format } from "date-fns";
import { Clock, MapPin, Store } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
};

// A reusable component for info rows
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
    <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
    <div className="flex-1 break-words">
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
  } = order;

  return (
    <Card className="col-span-1 py-4">
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
        ) : requested_delivery_time ? (
          <InfoRow Icon={Clock} label="Requested Delivery">
            {format(new Date(requested_delivery_time), "PPp")}
          </InfoRow>
        ) : null}
      </CardContent>
    </Card>
  );
}
