import { format } from "date-fns";
import { Clock, MapPin, Store } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  shopName: string;
  deliveryAddress: string;
  requestedDeliveryTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
};

export default function OrderDetailsInfo({
  shopName,
  deliveryAddress,
  requestedDeliveryTime,
  estimatedDeliveryTime,
  actualDeliveryTime,
}: Props) {
  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-lg">Order Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Restaurant</p>
            <p className="text-sm text-muted-foreground">{shopName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Delivery Address</p>
            <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
          </div>
        </div>

        {requestedDeliveryTime && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Requested Delivery Time</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(requestedDeliveryTime), "PPP 'at' pp")}
              </p>
            </div>
          </div>
        )}

        {estimatedDeliveryTime && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Estimated Delivery Time</p>
              <p className="text-sm text-blue-600">
                {format(new Date(estimatedDeliveryTime), "PPP 'at' pp")}
              </p>
            </div>
          </div>
        )}

        {actualDeliveryTime && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Actual Delivery Time</p>
              <p className="text-sm text-green-600">
                {format(new Date(actualDeliveryTime), "PPP 'at' pp")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
