import { OrderStatus } from "@prisma/client";
import { Clock } from "lucide-react";
import React from "react";

type Props = {
  shopName: string;
  deliveryAddress: string;
  actualDeliveryTime?: string;
  estimatedDeliveryTime?: string;
  requestedDeliveryTime?: string;
  status: OrderStatus;
};

export default function OrderCardDetails({
  shopName,
  deliveryAddress,
  actualDeliveryTime,
  estimatedDeliveryTime,
  requestedDeliveryTime,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Restaurant</span>
        <span className="text-sm text-muted-foreground">{shopName}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Delivery Address</span>
        <span className="text-sm text-muted-foreground">{deliveryAddress}</span>
      </div>

      {requestedDeliveryTime && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Requested Delivery</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {requestedDeliveryTime}
          </div>
        </div>
      )}

      {estimatedDeliveryTime && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estimated Delivery</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {estimatedDeliveryTime}
          </div>
        </div>
      )}

      {actualDeliveryTime && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Actual Delivery</span>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Clock className="h-3 w-3" />
            {actualDeliveryTime}
          </div>
        </div>
      )}
    </div>
  );
}
