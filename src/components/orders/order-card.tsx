import React from "react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SerializedOrderWithDetails } from "@/types";

import OrderCardDetails from "./order-card-details";
import OrderCardFooter from "./order-card-footer";
import OrderCardHeader from "./order-card-header";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderCard({ order }: Props) {
  return (
    <Card className="py-4">
      <OrderCardHeader
        orderDate={order.created_at}
        orderId={order.display_id}
        orderItemsCount={order.items.length}
        orderStatus={order.order_status}
        orderTotal={Number(order.total_price)}
      />
      <CardContent>
        <OrderCardDetails
          deliveryAddress={order.delivery_address_snapshot}
          actualDeliveryTime={order.actual_delivery_time}
          estimatedDeliveryTime={order.estimated_delivery_time}
          requestedDeliveryTime={order.requested_delivery_time}
          shopName={order.shop.name}
          status={order.order_status}
        />
      </CardContent>
      <CardFooter>
        <OrderCardFooter orderId={order.id} />
      </CardFooter>
    </Card>
  );
}
